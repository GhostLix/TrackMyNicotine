export type Score = 'A' | 'B' | 'C' | 'D' | 'E';

export type Product = {
  id: string;
  name: string;
  /** Descrizione breve mostrata sotto il nome nella tendina. */
  detail: string;
  /** Nicotina stimata assorbita per singolo tiro, in mg. */
  mgPerPuff: number;
  score: Score;
};

// ATTENZIONE: valori indicativi per l'MVP. Vanno sostituiti con dati da fonti
// verificabili prima della pubblicazione: l'assorbimento reale varia molto
// tra prodotti, dispositivi e stile di inalazione.
export const PRODUCTS: Product[] = [
  { id: 'cig', name: 'Sigaretta tradizionale', detail: '~10 tiri a sigaretta', mgPerPuff: 0.11, score: 'E' },
  { id: 'rolled', name: 'Sigaretta rollata', detail: 'Tabacco trinciato', mgPerPuff: 0.12, score: 'E' },
  { id: 'heated', name: 'Tabacco riscaldato', detail: 'Stick a riscaldamento', mgPerPuff: 0.07, score: 'D' },
  { id: 'vape20', name: 'Svapo 20 mg/ml', detail: 'Sali di nicotina', mgPerPuff: 0.06, score: 'C' },
  { id: 'vape10', name: 'Svapo 10 mg/ml', detail: 'Liquido pronto', mgPerPuff: 0.03, score: 'B' },
  { id: 'vape3', name: 'Svapo 3 mg/ml', detail: 'Basso contenuto', mgPerPuff: 0.01, score: 'A' },
];

export const SCORE_COLORS: Record<Score, string> = {
  A: '#1E9E5A',
  B: '#7CC242',
  C: '#F5C518',
  D: '#F08A24',
  E: '#E5484D',
};

export function getProduct(id: string | null | undefined): Product {
  return PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];
}
