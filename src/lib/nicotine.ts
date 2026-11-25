export type Puff = {
  /** Timestamp in millisecondi. */
  t: number;
  productId: string;
  mg: number;
};

/** Emivita plasmatica media della nicotina (~2 ore). */
export const NICOTINE_HALF_LIFE_MIN = 120;

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function puffsToday(puffs: Puff[], now: number): Puff[] {
  const start = startOfDay(now);
  return puffs.filter((p) => p.t >= start && p.t <= now);
}

/**
 * Stima della nicotina presente nel corpo all'istante `at`:
 * ogni tiro aggiunge `mg` che decadono esponenzialmente con l'emivita.
 * Modello volutamente semplice (monocompartimentale, assorbimento istantaneo).
 */
export function bodyNicotineAt(puffs: Puff[], at: number): number {
  let total = 0;
  for (const p of puffs) {
    if (p.t > at) continue;
    const elapsedMin = (at - p.t) / MIN;
    total += p.mg * Math.pow(0.5, elapsedMin / NICOTINE_HALF_LIFE_MIN);
  }
  return total;
}

/** Serie temporale delle ultime 24 ore, un punto ogni `stepMin` minuti. */
export function bodyNicotineSeries(puffs: Puff[], now: number, stepMin = 10) {
  const from = now - 24 * HOUR;
  const points: { t: number; mg: number }[] = [];
  for (let t = from; t <= now; t += stepMin * MIN) {
    points.push({ t, mg: bodyNicotineAt(puffs, t) });
  }
  if (points[points.length - 1].t !== now) {
    points.push({ t: now, mg: bodyNicotineAt(puffs, now) });
  }
  return points;
}

/** Tiene solo gli ultimi 30 giorni (serviranno per le statistiche). */
export function prunePuffs(puffs: Puff[], now: number): Puff[] {
  const limit = now - 30 * 24 * HOUR;
  return puffs.filter((p) => p.t >= limit);
}

export function formatMg(mg: number): string {
  if (mg === 0) return '0';
  // Sotto 1 mg servono 3 decimali (un tiro di svapo vale ~0.01–0.06 mg), poi bastano 2 e 1.
  if (mg < 1) return String(Math.round(mg * 1000) / 1000);
  return mg < 10 ? mg.toFixed(2) : mg.toFixed(1);
}
