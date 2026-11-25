/**
 * Modello UNICO per stimare la nicotina assorbita per tiro a partire dalle
 * specifiche di un prodotto. Lo usano sia il catalogo sia la ricerca AI, così
 * i valori sono sempre confrontabili.
 *
 * Riferimenti usati per le costanti (stime, non misure sul singolo utente):
 * - Sigaretta: ~1–2 mg di nicotina assorbita per sigaretta, ~10 tiri
 *   (NIDA; NCI Monograph 7). Il valore "dichiarato" ISO conta poco: chi fuma
 *   sigarette "leggere" tende a compensare con tiri più profondi.
 * - Tabacco riscaldato: ~1.1–1.2 mg nell'aerosol per stick TEREA/HEETS (ISO),
 *   max 14 tiri per sessione IQOS ILUMA (dati PMI; test indipendenti).
 * - Svapo: nicotina vaporizzata = mg/ml × ml consumati per tiro. Una usa e getta
 *   da 2 ml dichiarata per 600 tiri consuma ~0.0033 ml/tiro. Si assume che
 *   circa il 60% della nicotina inalata venga assorbita.
 */

export type Category = 'sigarette' | 'rollate' | 'riscaldato' | 'usa_e_getta' | 'pod' | 'liquidi';

export const CATEGORY_LABELS: Record<Category, string> = {
  sigarette: 'Sigarette',
  rollate: 'Tabacco da rollare',
  riscaldato: 'Tabacco riscaldato',
  usa_e_getta: 'Svapo usa e getta',
  pod: 'Svapo a pod',
  liquidi: 'Liquidi (sistemi aperti)',
};

export const CATEGORY_ORDER: Category[] = [
  'sigarette',
  'rollate',
  'riscaldato',
  'usa_e_getta',
  'pod',
  'liquidi',
];

export type Strength = 'full' | 'medium' | 'light';

/** mg assorbiti per sigaretta, per forza della variante. */
const CIGARETTE_ABSORBED_MG: Record<Strength, number> = { full: 1.2, medium: 1.0, light: 0.8 };
const CIGARETTE_PUFFS = 10;

/** Tabacco riscaldato: quota dell'aerosol effettivamente assorbita e tiri per stick. */
const HEATED_ABSORPTION = 0.75;
const HEATED_PUFFS = 14;

/** Svapo: quota di nicotina inalata che viene assorbita. */
const VAPE_ABSORPTION = 0.6;
/** ml di liquido per tiro quando il produttore non dichiara capacità e tiri. */
const POD_ML_PER_PUFF = 0.004;
const MTL_ML_PER_PUFF = 0.006;
const DTL_ML_PER_PUFF = 0.012;

export type ProductSpecs =
  | { category: 'sigarette' | 'rollate'; strength: Strength }
  | { category: 'riscaldato'; nicotineMgPerStick: number; puffsPerStick?: number }
  | { category: 'usa_e_getta' | 'pod'; nicotineMgPerMl: number; capacityMl?: number; ratedPuffs?: number }
  | { category: 'liquidi'; nicotineMgPerMl: number; vapeStyle: 'mtl' | 'dtl' };

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function estimateMgPerPuff(specs: ProductSpecs): number {
  switch (specs.category) {
    case 'sigarette':
    case 'rollate':
      return round3(CIGARETTE_ABSORBED_MG[specs.strength] / CIGARETTE_PUFFS);
    case 'riscaldato':
      return round3(
        (specs.nicotineMgPerStick * HEATED_ABSORPTION) / (specs.puffsPerStick ?? HEATED_PUFFS),
      );
    case 'usa_e_getta':
    case 'pod': {
      const mlPerPuff =
        specs.capacityMl && specs.ratedPuffs ? specs.capacityMl / specs.ratedPuffs : POD_ML_PER_PUFF;
      return round3(specs.nicotineMgPerMl * mlPerPuff * VAPE_ABSORPTION);
    }
    case 'liquidi': {
      const mlPerPuff = specs.vapeStyle === 'dtl' ? DTL_ML_PER_PUFF : MTL_ML_PER_PUFF;
      return round3(specs.nicotineMgPerMl * mlPerPuff * VAPE_ABSORPTION);
    }
  }
}

/** Descrizione breve delle specifiche, mostrata sotto il nome del prodotto. */
export function describeSpecs(specs: ProductSpecs): string {
  switch (specs.category) {
    case 'sigarette':
    case 'rollate':
      return { full: 'Gusto pieno', medium: 'Gusto medio', light: 'Leggera' }[specs.strength];
    case 'riscaldato':
      return `${specs.nicotineMgPerStick} mg/stick`;
    case 'usa_e_getta':
    case 'pod': {
      const parts = [`${specs.nicotineMgPerMl} mg/ml`];
      if (specs.capacityMl) parts.push(`${specs.capacityMl} ml`);
      if (specs.ratedPuffs) parts.push(`${specs.ratedPuffs} tiri`);
      return parts.join(' · ');
    }
    case 'liquidi':
      return `${specs.nicotineMgPerMl} mg/ml · ${specs.vapeStyle.toUpperCase()}`;
  }
}
