export type Score = 'A' | 'B' | 'C' | 'D' | 'E';

export type Product = {
  id: string;
  name: string;
  /** Descrizione breve mostrata sotto il nome. */
  detail: string;
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

// ATTENZIONE: valori indicativi per l'MVP. Vanno sostituiti con dati da fonti
// verificabili prima della pubblicazione: l'assorbimento reale varia molto
// tra prodotti, dispositivi e stile di inalazione.
export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'cig', name: 'Sigaretta tradizionale', detail: '~10 tiri a sigaretta', mgPerPuff: 0.11 },
  { id: 'rolled', name: 'Sigaretta rollata', detail: 'Tabacco trinciato', mgPerPuff: 0.12 },
  { id: 'heated', name: 'Tabacco riscaldato', detail: 'Stick a riscaldamento', mgPerPuff: 0.07 },
  { id: 'vape20', name: 'Svapo 20 mg/ml', detail: 'Sali di nicotina', mgPerPuff: 0.06 },
  { id: 'vape10', name: 'Svapo 10 mg/ml', detail: 'Liquido pronto', mgPerPuff: 0.03 },
  { id: 'vape3', name: 'Svapo 3 mg/ml', detail: 'Basso contenuto', mgPerPuff: 0.01 },
];

export const SCORE_COLORS: Record<Score, string> = {
  A: '#1E9E5A',
  B: '#7CC242',
  C: '#F5C518',
  D: '#F08A24',
  E: '#E5484D',
};

export function formatMgPerPuff(mg: number): string {
  // Fino a 3 decimali, senza zeri finali inutili (0.110 -> 0.11).
  return String(Math.round(mg * 1000) / 1000);
}
