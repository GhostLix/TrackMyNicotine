import {
  describeSpecs,
  estimateMgPerPuff,
  type Category,
  type ProductSpecs,
  type Strength,
} from '@/data/nicotine-model';

export type Score = 'A' | 'B' | 'C' | 'D' | 'E';

export type Product = {
  id: string;
  name: string;
  /** Descrizione breve mostrata sotto il nome. */
  detail: string;
  category: Category;
  /** Nicotina stimata assorbita per singolo tiro, in mg. */
  mgPerPuff: number;
  /** true se creato dall'utente (modificabile ed eliminabile). */
  custom?: boolean;
};

/**
 * Soglie del punteggio, in mg di nicotina per tiro (limite superiore incluso).
 * Il punteggio misura SOLO la nicotina per tiro: non tiene conto di combustione,
 * catrame o altre sostanze. Va detto chiaramente nell'app.
 */
export const SCORE_THRESHOLDS: { score: Score; maxMg: number }[] = [
  { score: 'A', maxMg: 0.015 },
  { score: 'B', maxMg: 0.04 },
  { score: 'C', maxMg: 0.065 },
  { score: 'D', maxMg: 0.09 },
  { score: 'E', maxMg: Infinity },
];

export function scoreFor(mgPerPuff: number): Score {
  return SCORE_THRESHOLDS.find((t) => mgPerPuff <= t.maxMg)!.score;
}

export const SCORE_COLORS: Record<Score, string> = {
  A: '#1E9E5A',
  B: '#6DB33F',
  C: '#E3A008',
  D: '#EE7D1F',
  E: '#E5484D',
};

export function formatMgPerPuff(mg: number): string {
  // Fino a 3 decimali, senza zeri finali inutili (0.110 -> 0.11).
  return String(Math.round(mg * 1000) / 1000);
}

// ---------------------------------------------------------------------------
// Catalogo. Le specifiche (mg/ml, ml, tiri, mg/stick) sono quelle dichiarate dai
// produttori; i mg per tiro sono STIME calcolate da src/data/nicotine-model.ts.
// I prodotti venduti in Italia seguono la direttiva UE (TPD): liquidi max 20 mg/ml,
// serbatoi precaricati max 2 ml.
// ---------------------------------------------------------------------------

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function make(name: string, specs: ProductSpecs, extra?: string): Product {
  const base = describeSpecs(specs);
  return {
    id: `${specs.category}-${slug(name)}`,
    name,
    detail: extra ? `${base} · ${extra}` : base,
    category: specs.category,
    mgPerPuff: estimateMgPerPuff(specs),
  };
}

const cig = (name: string, strength: Strength) => make(name, { category: 'sigarette', strength });
const roll = (name: string, strength: Strength = 'full') =>
  make(name, { category: 'rollate', strength });
const heated = (name: string, nicotineMgPerStick: number, extra?: string) =>
  make(name, { category: 'riscaldato', nicotineMgPerStick }, extra);
const disposable = (name: string, nicotineMgPerMl: number, capacityMl: number, ratedPuffs: number) =>
  make(name, { category: 'usa_e_getta', nicotineMgPerMl, capacityMl, ratedPuffs });
const pod = (name: string, nicotineMgPerMl: number, capacityMl?: number, ratedPuffs?: number) =>
  make(name, { category: 'pod', nicotineMgPerMl, capacityMl, ratedPuffs });
const liquid = (name: string, nicotineMgPerMl: number, vapeStyle: 'mtl' | 'dtl') =>
  make(name, { category: 'liquidi', nicotineMgPerMl, vapeStyle });

export const CATALOG: Product[] = [
  // Sigarette
  cig('Marlboro Red', 'full'),
  cig('Marlboro Gold', 'medium'),
  cig('Marlboro Touch', 'light'),
  cig('Camel Original', 'full'),
  cig('Camel Blue', 'medium'),
  cig('Chesterfield Red', 'full'),
  cig('Chesterfield Blue', 'medium'),
  cig('Winston Classic', 'full'),
  cig('Winston Blue', 'medium'),
  cig('Winston Silver', 'light'),
  cig('Lucky Strike Red', 'full'),
  cig('Lucky Strike Blue', 'medium'),
  cig('MS Rossa', 'full'),
  cig('MS Blu', 'medium'),
  cig('Philip Morris Red', 'full'),
  cig('Philip Morris Blue', 'medium'),
  cig('L&M Red', 'full'),
  cig('L&M Blue', 'medium'),
  cig('Pall Mall Red', 'full'),
  cig('Pall Mall Blue', 'medium'),
  cig('Diana Rossa', 'full'),
  cig('Diana Blu', 'medium'),
  cig('Rothmans Red', 'full'),
  cig('Rothmans Blue', 'medium'),
  cig('Davidoff Classic', 'full'),
  cig('Davidoff Gold', 'medium'),
  cig('Benson & Hedges Gold', 'medium'),
  cig('Kent Blue', 'light'),
  cig('Merit', 'light'),
  cig('Sigaretta slim / superslim', 'light'),

  // Tabacco da rollare
  roll('Golden Virginia'),
  roll('Drum'),
  roll('Pueblo'),
  roll('Manitou'),
  roll('Amber Leaf'),
  roll('Mac Baren'),

  // Tabacco riscaldato
  heated('TEREA (IQOS ILUMA)', 1.1),
  heated('HEETS (IQOS Originals)', 1.2),
  heated('DELIA (IQOS ILUMA i)', 1.1),
  heated('neo / veo (glo)', 0.9),
  heated('EVO (Ploom X)', 1.0),
  heated('Fiit (lil SOLID)', 1.0),

  // Svapo usa e getta (formato TPD: 2 ml)
  disposable('Elf Bar 600', 20, 2, 600),
  disposable('Elf Bar 600 V2', 20, 2, 600),
  disposable('Lost Mary BM600', 20, 2, 600),
  disposable('SKE Crystal Bar', 20, 2, 600),
  disposable('Geek Bar 600', 20, 2, 600),
  disposable('IVG Bar 600', 20, 2, 600),
  disposable('Elux Legend 600', 20, 2, 600),
  disposable('Hayati Pro Mini', 20, 2, 600),
  disposable('Vuse Go 500', 20, 2, 500),
  disposable('Usa e getta 800 tiri', 20, 2, 800),
  disposable('Usa e getta 600 tiri 10 mg', 10, 2, 600),

  // Svapo a pod precaricati
  pod('JUUL', 18, 0.7, 200),
  pod('Vuse ePod 18 mg', 18),
  pod('Vuse ePod 12 mg', 12),
  pod('Vuse ePod 6 mg', 6),
  pod('RELX Infinity', 18),
  pod('Elfa (Elf Bar)', 20, 2, 600),
  pod('Lost Mary Tappo', 20, 2, 600),
  pod('IQOS VEEV ONE', 18),

  // Liquidi per sistemi aperti
  liquid('Sali di nicotina 20 mg/ml', 20, 'mtl'),
  liquid('Sali di nicotina 10 mg/ml', 10, 'mtl'),
  liquid('Liquido 18 mg/ml (guancia)', 18, 'mtl'),
  liquid('Liquido 12 mg/ml (guancia)', 12, 'mtl'),
  liquid('Liquido 9 mg/ml (guancia)', 9, 'mtl'),
  liquid('Liquido 6 mg/ml (guancia)', 6, 'mtl'),
  liquid('Liquido 6 mg/ml (polmone)', 6, 'dtl'),
  liquid('Liquido 3 mg/ml (polmone)', 3, 'dtl'),
  liquid('Liquido 0 mg/ml', 0, 'dtl'),
];

/** Prodotti attivi (con la spunta) alla prima apertura. */
export const DEFAULT_ENABLED_IDS: string[] = [
  'sigarette-marlboro-red',
  'sigarette-marlboro-gold',
  'rollate-golden-virginia',
  'riscaldato-terea-iqos-iluma',
  'usa_e_getta-elf-bar-600',
  'pod-vuse-epod-18-mg',
  'liquidi-liquido-12-mg-ml-guancia',
];
