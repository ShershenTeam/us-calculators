/**
 * Paint calculator — pure functions, no UI.
 * Formula, reference examples and sources: docs/briefs/paint-calculator.md §3.
 *
 *   room walls     = 2 × (length + width) × height − doors − windows
 *   room ceiling   = length × width            (separate total: usually a different paint)
 *   single wall    = width × height − doors − windows
 *   paint (gal)    = area × coats ÷ coverage per gallon
 *   primer (gal)   = (walls + ceilings) ÷ primer coverage   (one coat, when switched on)
 *   to buy         = rounded up to whole quarts, then packed into 5-gal buckets, gallons and quarts
 */
import type { BuyPlan, PaintInput, PaintResult, Step, SurfaceInput, SurfaceResult, UnitSystem } from './types';
import { fmt } from '@/lib/format';
import { FT_PER_M, FT2_PER_M2, M2_PER_FT2 } from '@/lib/area';

/* Exact factors — NIST SP 811 Appendix B / Handbook 44 Appendix C: 1 U.S. gallon = 231 in³ = 3.785411784 L. */
export const L_PER_GAL = 3.785411784;
export const QT_PER_GAL = 4;
export const GAL_PER_BUCKET = 5;

/**
 * Coverage per gallon per coat. Manufacturer data sheets (brief §3): Sherwin-Williams ProMar 200 Zero VOC
 * Interior Latex 350–400 sq ft; Benjamin Moore Regal Select 400–450 sq ft. Default = the low end, so the
 * estimate errs on having enough.
 */
export const DEFAULT_COVERAGE_FT2 = 350;
/** Both data sheets recommend two coats (Benjamin Moore: "recommends two coats"; S-W specs list 2 coats). */
export const DEFAULT_COATS = 2;
/** A 36 × 80 in door and a 3 × 4 ft window. */
export const DOOR_FT2 = 20;
export const WINDOW_FT2 = 12;

export const MAX_COATS = 4;
export const MAX_QTY = 99;

/** ft²/gal ↔ m²/L. */
export const ft2PerGalToM2PerL = (v: number): number => (v * M2_PER_FT2) / L_PER_GAL;
export const m2PerLToFt2PerGal = (v: number): number => (v * L_PER_GAL) / M2_PER_FT2;

export const DEFAULT_INPUT: PaintInput = {
  units: 'imperial',
  surfaces: [{ id: 'p1', name: 'Bedroom', kind: 'room', a: 12, b: 12, c: 8, ceiling: false, doors: 1, windows: 1, qty: 1 }],
  coats: DEFAULT_COATS,
  coverage: DEFAULT_COVERAGE_FT2,
  primer: false,
  primerCoverage: DEFAULT_COVERAGE_FT2,
  doorArea: DOOR_FT2,
  windowArea: WINDOW_FT2,
};

/* ---------- helpers ---------- */

function isBad(n: number | undefined): boolean {
  return n == null || !Number.isFinite(n) || n < 0;
}

export function whole(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

const lenFt = (v: number, units: UnitSystem) => (units === 'metric' ? v * FT_PER_M : v);
const areaFt = (v: number, units: UnitSystem) => (units === 'metric' ? v * FT2_PER_M2 : v);

/** Coverage entered as ft²/gal (imperial) or m²/L (metric), as ft²/gal. */
export function coverageFt2PerGal(coverage: number, units: UnitSystem): number {
  return units === 'metric' ? m2PerLToFt2PerGal(coverage) : coverage;
}

/* ---------- geometry ---------- */

export function computeSurface(s: SurfaceInput, input: Pick<PaintInput, 'units' | 'doorArea' | 'windowArea'>, index: number): SurfaceResult {
  const { units } = input;
  const name = s.name.trim() || `Room ${index + 1}`;
  const qty = whole(s.qty, 1, MAX_QTY);
  const base = { id: s.id, name, kind: s.kind, qty };
  const doors = whole(s.doors, 0, 50);
  const windows = whole(s.windows, 0, 50);
  const openingsOne = doors * areaFt(input.doorArea, units) + windows * areaFt(input.windowArea, units);

  let gross = 0;
  let ceiling = 0;
  if (s.kind === 'room') {
    if (isBad(s.a) || isBad(s.b) || isBad(s.c)) return { ...base, wallFt2: 0, ceilingFt2: 0, openingsFt2: 0, error: 'Enter length, width and wall height of 0 or more.' };
    const L = lenFt(s.a, units);
    const W = lenFt(s.b!, units);
    gross = 2 * (L + W) * lenFt(s.c!, units);
    ceiling = s.ceiling ? L * W : 0;
  } else if (s.kind === 'wall') {
    if (isBad(s.a) || isBad(s.b)) return { ...base, wallFt2: 0, ceilingFt2: 0, openingsFt2: 0, error: 'Enter the wall width and height.' };
    gross = lenFt(s.a, units) * lenFt(s.b!, units);
  } else {
    if (isBad(s.a)) return { ...base, wallFt2: 0, ceilingFt2: 0, openingsFt2: 0, error: 'Enter an area of 0 or more.' };
    gross = areaFt(s.a, units);
  }
  const openings = Math.min(openingsOne, gross);
  return { ...base, wallFt2: (gross - openings) * qty, ceilingFt2: ceiling * qty, openingsFt2: openings * qty };
}

/* ---------- buying ---------- */

/** Round up to whole quarts and pack into 5-gal buckets, gallons and quarts; 3 quarts become a gallon. */
export function buyPlan(gallons: number): BuyPlan {
  if (!(gallons > 0)) return { buckets: 0, gallons: 0, quarts: 0, totalGal: 0 };
  let q = Math.ceil(gallons * QT_PER_GAL - 1e-9);
  const buckets = Math.floor(q / (GAL_PER_BUCKET * QT_PER_GAL));
  q -= buckets * GAL_PER_BUCKET * QT_PER_GAL;
  let gal = Math.floor(q / QT_PER_GAL);
  let quarts = q - gal * QT_PER_GAL;
  if (quarts >= 3) {
    gal += 1;
    quarts = 0;
  }
  return { buckets, gallons: gal, quarts, totalGal: buckets * GAL_PER_BUCKET + gal + quarts / QT_PER_GAL };
}

export function describeBuy(p: BuyPlan): string {
  const parts: string[] = [];
  if (p.buckets) parts.push(`${p.buckets} × 5-gal bucket${p.buckets > 1 ? 's' : ''}`);
  if (p.gallons) parts.push(`${p.gallons} gal`);
  if (p.quarts) parts.push(`${p.quarts} qt`);
  return parts.length ? parts.join(' + ') : '—';
}

/* ---------- main ---------- */

export function calculatePaint(input: PaintInput): PaintResult {
  const { units } = input;
  const surfaces = input.surfaces.map((s, i) => computeSurface(s, input, i));
  const valid = surfaces.filter((s) => !s.error);

  const wallFt2 = valid.reduce((t, s) => t + s.wallFt2, 0);
  const ceilingFt2 = valid.reduce((t, s) => t + s.ceilingFt2, 0);

  const coats = whole(input.coats, 1, MAX_COATS);
  const cov = coverageFt2PerGal(input.coverage, units);
  const pCov = coverageFt2PerGal(input.primerCoverage, units);
  const ok = cov > 0;

  const wallGal = ok ? (wallFt2 * coats) / cov : 0;
  const ceilingGal = ok ? (ceilingFt2 * coats) / cov : 0;
  const primerGal = input.primer && pCov > 0 ? (wallFt2 + ceilingFt2) / pCov : 0;

  const wallBuy = buyPlan(wallGal);
  const ceilingBuy = buyPlan(ceilingGal);
  const primerBuy = buyPlan(primerGal);

  const price = input.price;
  const cost =
    price != null && Number.isFinite(price) && price >= 0
      ? units === 'metric'
        ? (wallGal + ceilingGal) * L_PER_GAL * price
        : (wallBuy.totalGal + ceilingBuy.totalGal) * price
      : undefined;

  const warnings: string[] = [];
  if (!ok) warnings.push('Enter the coverage printed on the can.');
  else if (cov < 200 || cov > 500) warnings.push(`${fmt(cov, 0)} sq ft per gallon is unusual for wall paint (data sheets give 350–450). Check the can.`);
  for (const [i, s] of input.surfaces.entries()) {
    const r = surfaces[i];
    if (r.error || s.kind === 'area') continue;
    const doors = whole(s.doors, 0, 50);
    const windows = whole(s.windows, 0, 50);
    if (doors + windows > 0 && r.wallFt2 === 0) warnings.push(`${r.name}: doors and windows cover the whole wall — check their number and size.`);
  }

  const metric = units === 'metric';
  const sq = (ft2: number) => (metric ? `${fmt(ft2 * M2_PER_FT2, 2)} m²` : `${fmt(ft2, 1)} ft²`);
  const len = metric ? 'm' : 'ft';
  const steps: Step[] = [];
  for (const r of valid) {
    const s = input.surfaces.find((x) => x.id === r.id)!;
    const qtyPart = r.qty > 1 ? ` × ${r.qty}` : '';
    const open = r.openingsFt2 > 0 ? ` − ${sq(r.openingsFt2 / r.qty)} doors & windows` : '';
    if (s.kind === 'room') {
      steps.push({ label: `${r.name} walls`, expression: `2 × (${fmt(s.a, 2)} + ${fmt(s.b ?? 0, 2)} ${len}) × ${fmt(s.c ?? 0, 2)} ${len}${open}${qtyPart}`, value: sq(r.wallFt2) });
      if (r.ceilingFt2 > 0) steps.push({ label: `${r.name} ceiling`, expression: `${fmt(s.a, 2)} × ${fmt(s.b ?? 0, 2)} ${len}${qtyPart}`, value: sq(r.ceilingFt2) });
    } else if (s.kind === 'wall') {
      steps.push({ label: r.name, expression: `${fmt(s.a, 2)} × ${fmt(s.b ?? 0, 2)} ${len}${open}${qtyPart}`, value: sq(r.wallFt2) });
    } else {
      steps.push({ label: r.name, expression: `${fmt(s.a, 2)} ${metric ? 'm²' : 'ft²'}${open}${qtyPart}`, value: sq(r.wallFt2) });
    }
  }
  const covText = metric ? `${fmt(input.coverage, 2)} m²/L` : `${fmt(input.coverage, 0)} ft²/gal`;
  const vol = (gal: number) => (metric ? `${fmt(gal * L_PER_GAL, 2)} L` : `${fmt(gal, 2)} gal`);
  if (ok) {
    steps.push({ label: 'Wall paint', expression: `${sq(wallFt2)} × ${coats} coat${coats > 1 ? 's' : ''} ÷ ${covText}`, value: vol(wallGal) });
    if (ceilingFt2 > 0) steps.push({ label: 'Ceiling paint', expression: `${sq(ceilingFt2)} × ${coats} coat${coats > 1 ? 's' : ''} ÷ ${covText}`, value: vol(ceilingGal) });
  }
  if (primerGal > 0) {
    const pc = metric ? `${fmt(input.primerCoverage, 2)} m²/L` : `${fmt(input.primerCoverage, 0)} ft²/gal`;
    steps.push({ label: 'Primer', expression: `${sq(wallFt2 + ceilingFt2)} × 1 coat ÷ ${pc}`, value: vol(primerGal) });
  }
  if (!metric && wallGal > 0) steps.push({ label: 'Buy (walls)', expression: `${fmt(wallGal * QT_PER_GAL, 2)} qt rounded up`, value: describeBuy(wallBuy) });
  if (cost != null) {
    steps.push({
      label: 'Cost',
      expression: metric ? `${fmt((wallGal + ceilingGal) * L_PER_GAL, 2)} L × $${fmt(price!, 2)}` : `${fmt(wallBuy.totalGal + ceilingBuy.totalGal, 2)} gal × $${fmt(price!, 2)}`,
      value: `$${fmt(cost, 2, true)}`,
    });
  }

  return {
    surfaces,
    wallFt2,
    ceilingFt2,
    wallGal,
    ceilingGal,
    primerGal,
    wallBuy,
    ceilingBuy,
    primerBuy,
    wallL: wallGal * L_PER_GAL,
    ceilingL: ceilingGal * L_PER_GAL,
    primerL: primerGal * L_PER_GAL,
    cost,
    steps,
    warnings,
  };
}
