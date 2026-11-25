import { Platform } from 'react-native';

import { estimateMgPerPuff, type Category, type ProductSpecs, type Strength } from '@/data/nicotine-model';

/**
 * Risultato della ricerca AI: le SPECIFICHE del prodotto, non i mg per tiro.
 * I mg per tiro li calcola l'app con lo stesso modello del catalogo.
 * Tenere allineato con `LookupResultSchema` in server/src/lookup.ts.
 */
export type AiLookupResult = {
  found: boolean;
  name: string;
  category: Category;
  strength: Strength | null;
  nicotineMgPerStick: number | null;
  nicotineMgPerMl: number | null;
  capacityMl: number | null;
  ratedPuffs: number | null;
  vapeStyle: 'mtl' | 'dtl' | null;
  confidence: 'alta' | 'media' | 'bassa';
  notes: string;
  sources: { title: string; url: string }[];
};

export type AiLookupOutcome = {
  result: AiLookupResult;
  /** null se le specifiche trovate non bastano per stimare i mg per tiro. */
  mgPerPuff: number | null;
  /** true se la risposta viene da una ricerca web, false se solo dalla conoscenza del modello. */
  webSearch: boolean;
};

export class AiLookupError extends Error {}

const CATEGORIES: Category[] = ['sigarette', 'rollate', 'riscaldato', 'usa_e_getta', 'pod', 'liquidi'];

/** URL del backend (vedi server/README.md). Se manca, nell'app nativa la ricerca AI è disattivata. */
const BACKEND_URL = process.env.EXPO_PUBLIC_AI_LOOKUP_URL;

// --- Anteprima web su claude.ai: la pagina può chiedere a Claude tramite la capability `sample`.
type SampleJson = (input: string, options?: { modelTier?: string; signal?: AbortSignal }) => Promise<unknown>;
type ClaudeRuntime = { use: (name: string) => Promise<{ json: SampleJson } | null> };

function claudeRuntime(): ClaudeRuntime | null {
  if (Platform.OS !== 'web') return null;
  const claude = (globalThis as { claude?: ClaudeRuntime }).claude;
  return claude && typeof claude.use === 'function' ? claude : null;
}

async function previewSampler(): Promise<SampleJson | null> {
  const runtime = claudeRuntime();
  if (!runtime) return null;
  try {
    const sample = await runtime.use('sample');
    return sample ? sample.json : null;
  } catch {
    return null;
  }
}

export async function isAiLookupAvailable(): Promise<boolean> {
  if (BACKEND_URL) return true;
  return (await previewSampler()) !== null;
}

export function specsFromResult(r: AiLookupResult): ProductSpecs | null {
  switch (r.category) {
    case 'sigarette':
    case 'rollate':
      return { category: r.category, strength: r.strength ?? 'full' };
    case 'riscaldato':
      return r.nicotineMgPerStick != null
        ? { category: 'riscaldato', nicotineMgPerStick: r.nicotineMgPerStick }
        : null;
    case 'usa_e_getta':
    case 'pod':
      return r.nicotineMgPerMl != null
        ? {
            category: r.category,
            nicotineMgPerMl: r.nicotineMgPerMl,
            capacityMl: r.capacityMl ?? undefined,
            ratedPuffs: r.ratedPuffs ?? undefined,
          }
        : null;
    case 'liquidi':
      return r.nicotineMgPerMl != null
        ? { category: 'liquidi', nicotineMgPerMl: r.nicotineMgPerMl, vapeStyle: r.vapeStyle ?? 'mtl' }
        : null;
  }
}

/** Valida e normalizza la risposta: arriva da un servizio esterno, non ci si fida dei tipi. */
function normalize(raw: unknown): AiLookupResult {
  if (!raw || typeof raw !== 'object') throw new AiLookupError('Risposta dell’AI non valida.');
  const o = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
  const category = CATEGORIES.includes(o.category as Category) ? (o.category as Category) : 'liquidi';
  const strength = ['full', 'medium', 'light'].includes(o.strength as string) ? (o.strength as Strength) : null;
  const sources = Array.isArray(o.sources)
    ? o.sources
        .filter(
          (s): s is { title: unknown; url: string } =>
            !!s && typeof s === 'object' && typeof (s as { url?: unknown }).url === 'string',
        )
        .filter((s) => s.url.startsWith('https://'))
        .slice(0, 5)
        .map((s) => ({ title: typeof s.title === 'string' ? s.title : s.url, url: s.url }))
    : [];
  return {
    found: o.found === true,
    name: typeof o.name === 'string' ? o.name.slice(0, 60) : '',
    category,
    strength,
    // Limiti TPD: oltre questi valori il dato è sicuramente sbagliato.
    nicotineMgPerStick: num(o.nicotineMgPerStick) !== null && num(o.nicotineMgPerStick)! <= 5 ? num(o.nicotineMgPerStick) : null,
    nicotineMgPerMl: num(o.nicotineMgPerMl) !== null && num(o.nicotineMgPerMl)! <= 50 ? num(o.nicotineMgPerMl) : null,
    capacityMl: num(o.capacityMl) !== null && num(o.capacityMl)! <= 30 ? num(o.capacityMl) : null,
    ratedPuffs: num(o.ratedPuffs) !== null && num(o.ratedPuffs)! <= 50000 ? num(o.ratedPuffs) : null,
    vapeStyle: o.vapeStyle === 'mtl' || o.vapeStyle === 'dtl' ? o.vapeStyle : null,
    confidence: o.confidence === 'alta' || o.confidence === 'media' ? o.confidence : 'bassa',
    notes: typeof o.notes === 'string' ? o.notes.slice(0, 300) : '',
    sources,
  };
}

const PREVIEW_PROMPT = (query: string) => `Un'app per monitorare la nicotina deve identificare questo prodotto: "${query.replace(/"/g, "'")}".
Usa ciò che sai delle specifiche pubblicate dal produttore (in Italia vale la direttiva UE: liquidi max 20 mg/ml, serbatoi precaricati max 2 ml).
Rispondi SOLO con un oggetto JSON con questi campi:
{"found": boolean, "name": string, "category": "sigarette"|"rollate"|"riscaldato"|"usa_e_getta"|"pod"|"liquidi",
 "strength": "full"|"medium"|"light"|null (solo sigarette e tabacco da rollare),
 "nicotineMgPerStick": number|null (tabacco riscaldato: mg nell'aerosol per stick),
 "nicotineMgPerMl": number|null, "capacityMl": number|null, "ratedPuffs": number|null (svapo),
 "vapeStyle": "mtl"|"dtl"|null (liquidi), "confidence": "alta"|"media"|"bassa",
 "notes": string (max 2 frasi in italiano), "sources": []}
Usa null per ciò che non sai: non inventare numeri. Se non riconosci il prodotto metti "found": false.`;

export async function lookupNicotine(query: string, signal?: AbortSignal): Promise<AiLookupOutcome> {
  const q = query.trim().slice(0, 120);
  if (!q) throw new AiLookupError('Scrivi il nome del prodotto.');

  let raw: unknown;
  let webSearch: boolean;

  if (BACKEND_URL) {
    let response: Response;
    try {
      response = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/nicotine-lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
        signal,
      });
    } catch {
      throw new AiLookupError('Connessione non riuscita. Controlla la rete e riprova.');
    }
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) throw new AiLookupError(body?.error ?? 'Ricerca non riuscita, riprova.');
    raw = body;
    webSearch = true;
  } else {
    const sampleJson = await previewSampler();
    if (!sampleJson) throw new AiLookupError('La ricerca AI non è disponibile qui.');
    try {
      raw = await sampleJson(PREVIEW_PROMPT(q), { modelTier: 'default', signal });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === 'cancelled') throw new AiLookupError('Ricerca annullata.');
      if (code === 'not_granted' || code === 'sampling_disabled') {
        throw new AiLookupError('Per usare l’AI devi consentire l’accesso a Claude.');
      }
      if (code === 'rate_limited') throw new AiLookupError('Troppe richieste, riprova tra poco.');
      throw new AiLookupError('Ricerca non riuscita, riprova.');
    }
    webSearch = false;
  }

  const result = normalize(raw);
  const specs = result.found ? specsFromResult(result) : null;
  return { result, mgPerPuff: specs ? estimateMgPerPuff(specs) : null, webSearch };
}
