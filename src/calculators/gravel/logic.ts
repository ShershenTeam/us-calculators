/**
 * Gravel calculator — pure functions, no UI.
 * Formula and reference examples: docs/briefs/gravel-calculator.md §3.
 *
 *   area (ft²)      = L×W | π(D/2)² | ½·b·h | given
 *   volume (ft³)    = area × depth(in) ÷ 12
 *   volume (yd³)    = ft³ ÷ 27
 *   order volume    = volume × (1 + waste%)
 *   weight (lb)     = order ft³ × density(lb/ft³);  tons = lb ÷ 2000
 *   bags            = ceil(order ft³ ÷ bag size)
 */
import type { AreaInput, AreaResult, GravelInput, GravelResult, Step, UnitSystem } from './types';
import { CUSTOM_TYPE_ID, DEFAULT_TYPE_ID, gravelTypeById } from './gravel-types';
import { fmt, round } from '@/lib/format';

// Exact factors — NIST SP 811 Appendix B.
export const FT_PER_M = 1 / 0.3048;
export const M_PER_FT = 0.3048;
export const IN_PER_FT = 12;
export const CM_PER_IN = 2.54;
export const FT3_PER_YD3 = 27;
export const M3_PER_YD3 = 0.764554857984; // 0.9144³
export const KG_PER_LB = 0.45359237;
export const LB_PER_SHORT_TON = 2000;
export const KG_PER_METRIC_TON = 1000;
export const LB_FT3_PER_KG_M3 = KG_PER_LB / M_PER_FT ** 3; // 16.018463… kg/m³ per lb/ft³

export const DENSITY_MIN_LB_FT3 = 50;
export const DENSITY_MAX_LB_FT3 = 200;
export const DEPTH_WARN_IN = 24;

export const DEFAULT_INPUT: GravelInput = {
  units: 'imperial',
  areas: [{ id: 'a1', shape: 'rectangle', a: 10, b: 10, depth: 3 }],
  gravelTypeId: DEFAULT_TYPE_ID,
  wastePct: 10,
  bagSizeFt3: 0.5,
  priceUnit: 'yd3',
};

/* ---------- unit helpers ---------- */

export const ft3ToYd3 = (ft3: number): number => ft3 / FT3_PER_YD3;
export const yd3ToFt3 = (yd3: number): number => yd3 * FT3_PER_YD3;
export const yd3ToM3 = (yd3: number): number => yd3 * M3_PER_YD3;
export const m3ToYd3 = (m3: number): number => m3 / M3_PER_YD3;
export const lbToTons = (lb: number): number => lb / LB_PER_SHORT_TON;
export const lbToKg = (lb: number): number => lb * KG_PER_LB;
export const kgM3ToLbFt3 = (kgM3: number): number => kgM3 / LB_FT3_PER_KG_M3;
export const lbFt3ToKgM3 = (lbFt3: number): number => lbFt3 * LB_FT3_PER_KG_M3;

/** Tons per cubic yard for a density in lb/ft³: ×27 ÷ 2000. */
export const tonsPerYd3 = (densityLbFt3: number): number => (densityLbFt3 * FT3_PER_YD3) / LB_PER_SHORT_TON;

/** Convert a linear measure entered in the active unit system to feet. */
export function toFeet(value: number, units: UnitSystem): number {
  return units === 'metric' ? value * FT_PER_M : value;
}

/** Convert a depth entered in inches (imperial) or centimetres (metric) to feet. */
export function depthToFeet(depth: number, units: UnitSystem): number {
  return units === 'metric' ? depth / (CM_PER_IN * IN_PER_FT) : depth / IN_PER_FT;
}

/** Convert an area entered in ft² or m² to ft². */
export function toSquareFeet(area: number, units: UnitSystem): number {
  return units === 'metric' ? area * FT_PER_M * FT_PER_M : area;
}

/* ---------- geometry ---------- */

function isBad(n: number | undefined): boolean {
  return n == null || !Number.isFinite(n) || n < 0;
}

/** Area in ft² for one input, or NaN with an error message. */
export function areaFt2(area: AreaInput, units: UnitSystem): { areaFt2: number; error?: string } {
  const a = area.a;
  const b = area.b;
  switch (area.shape) {
    case 'rectangle':
      if (isBad(a) || isBad(b)) return { areaFt2: NaN, error: 'Enter a length and a width of 0 or more.' };
      return { areaFt2: toFeet(a, units) * toFeet(b!, units) };
    case 'circle':
      if (isBad(a)) return { areaFt2: NaN, error: 'Enter a diameter of 0 or more.' };
      return { areaFt2: Math.PI * (toFeet(a, units) / 2) ** 2 };
    case 'triangle':
      if (isBad(a) || isBad(b)) return { areaFt2: NaN, error: 'Enter a base and a height of 0 or more.' };
      return { areaFt2: 0.5 * toFeet(a, units) * toFeet(b!, units) };
    case 'area':
      if (isBad(a)) return { areaFt2: NaN, error: 'Enter an area of 0 or more.' };
      return { areaFt2: toSquareFeet(a, units) };
  }
}

/** Volume in ft³ from an area in ft² and a depth in the active unit. */
export function volumeFt3(areaFt2: number, depth: number, units: UnitSystem): number {
  return areaFt2 * depthToFeet(depth, units);
}

export function computeArea(area: AreaInput, units: UnitSystem): AreaResult {
  const { areaFt2: sq, error } = areaFt2(area, units);
  if (error) return { id: area.id, shape: area.shape, areaFt2: 0, volumeFt3: 0, volumeYd3: 0, error };
  if (isBad(area.depth)) {
    return { id: area.id, shape: area.shape, areaFt2: sq, volumeFt3: 0, volumeYd3: 0, error: 'Enter a depth of 0 or more.' };
  }
  const ft3 = volumeFt3(sq, area.depth, units);
  return { id: area.id, shape: area.shape, areaFt2: sq, volumeFt3: ft3, volumeYd3: ft3ToYd3(ft3) };
}

/* ---------- ordering ---------- */

/** Whole bags, rounded up; 0 when nothing is needed. */
export function bagsNeeded(volumeFt3: number, bagSizeFt3: number): number {
  if (!(bagSizeFt3 > 0) || !(volumeFt3 > 0)) return 0;
  return Math.ceil(volumeFt3 / bagSizeFt3 - 1e-9);
}

export function resolveDensity(input: GravelInput): number {
  if (input.gravelTypeId === CUSTOM_TYPE_ID) {
    const d = input.customDensityLbFt3;
    return d != null && Number.isFinite(d) && d > 0 ? d : (gravelTypeById(DEFAULT_TYPE_ID)!.densityLbFt3);
  }
  return (gravelTypeById(input.gravelTypeId) ?? gravelTypeById(DEFAULT_TYPE_ID)!).densityLbFt3;
}

export function cost(orderYd3: number, weightTons: number, price: number | undefined, unit: 'yd3' | 'ton'): number | undefined {
  if (price == null || !Number.isFinite(price) || price < 0) return undefined;
  return unit === 'ton' ? weightTons * price : orderYd3 * price;
}

/** ft² covered by one U.S. ton at the given depth (in). */
export function coveragePerTonFt2(densityLbFt3: number, depthIn: number): number {
  const ft3PerTon = LB_PER_SHORT_TON / densityLbFt3;
  return ft3PerTon / (depthIn / IN_PER_FT);
}

/** ft² covered by one cubic yard at the given depth (in). */
export function coveragePerYd3Ft2(depthIn: number): number {
  return FT3_PER_YD3 / (depthIn / IN_PER_FT);
}

export const COVERAGE_DEPTHS_IN = [1, 2, 3, 4, 6] as const;

export function coverageTable(densityLbFt3: number) {
  return COVERAGE_DEPTHS_IN.map((d) => ({
    depthIn: d,
    perYd3: coveragePerYd3Ft2(d),
    perTon: coveragePerTonFt2(densityLbFt3, d),
  }));
}

/* ---------- main ---------- */

export function calculateGravel(input: GravelInput): GravelResult {
  const units = input.units;
  const areas = input.areas.map((a) => computeArea(a, units));
  const valid = areas.filter((a) => !a.error);

  const areaTotal = valid.reduce((s, a) => s + a.areaFt2, 0);
  const ft3 = valid.reduce((s, a) => s + a.volumeFt3, 0);
  const yd3 = ft3ToYd3(ft3);

  const waste = Number.isFinite(input.wastePct) ? Math.min(50, Math.max(0, input.wastePct)) : 0;
  const factor = 1 + waste / 100;
  const orderFt3 = ft3 * factor;
  const orderYd3 = ft3ToYd3(orderFt3);

  const density = resolveDensity(input);
  const lb = orderFt3 * density;
  const tons = lbToTons(lb);
  const kg = lbToKg(lb);

  const bags = bagsNeeded(orderFt3, input.bagSizeFt3);
  const total = cost(orderYd3, tons, input.price, input.priceUnit);

  const warnings: string[] = [];
  if (input.gravelTypeId === CUSTOM_TYPE_ID && (density < DENSITY_MIN_LB_FT3 || density > DENSITY_MAX_LB_FT3)) {
    warnings.push(`Density ${fmt(density, 0)} lb/ft³ is outside the usual 50–200 lb/ft³ range for gravel.`);
  }
  if (input.areas.some((a) => Number.isFinite(a.depth) && depthToFeet(a.depth, units) * IN_PER_FT > DEPTH_WARN_IN)) {
    warnings.push('A depth over 24 in is unusual for gravel; double-check the unit.');
  }

  const steps: Step[] = [];
  valid.forEach((a, i) => {
    const src = input.areas.find((x) => x.id === a.id)!;
    steps.push({ label: `Area ${i + 1}`, expression: areaExpression(src, units), value: `${fmt(a.areaFt2, 2)} ft²` });
    steps.push({
      label: `Volume ${i + 1}`,
      expression: `${fmt(a.areaFt2, 2)} ft² × ${depthExpression(src.depth, units)}`,
      value: `${fmt(a.volumeFt3, 2)} ft³`,
    });
  });
  if (valid.length > 1) steps.push({ label: 'Total volume', expression: valid.map((a) => fmt(a.volumeFt3, 2)).join(' + '), value: `${fmt(ft3, 2)} ft³` });
  steps.push({ label: 'Cubic yards', expression: `${fmt(ft3, 2)} ft³ ÷ 27`, value: `${fmt(yd3, 3)} yd³` });
  if (waste > 0) steps.push({ label: `+${fmt(waste, 0)}% waste`, expression: `${fmt(yd3, 3)} × ${fmt(factor, 2)}`, value: `${fmt(orderYd3, 3)} yd³` });
  steps.push({ label: 'Weight', expression: `${fmt(orderFt3, 2)} ft³ × ${fmt(density, 0)} lb/ft³`, value: `${fmt(lb, 0)} lb` });
  steps.push({ label: 'Tons', expression: `${fmt(lb, 0)} lb ÷ 2,000`, value: `${fmt(tons, 2)} tons` });
  if (bags > 0) steps.push({ label: 'Bags', expression: `⌈${fmt(orderFt3, 2)} ft³ ÷ ${fmt(input.bagSizeFt3, 2)} ft³⌉`, value: `${bags} bags` });
  if (total != null) {
    steps.push({
      label: 'Cost',
      expression: input.priceUnit === 'ton' ? `${fmt(tons, 2)} tons × $${fmt(input.price!, 2)}` : `${fmt(orderYd3, 3)} yd³ × $${fmt(input.price!, 2)}`,
      value: `$${fmt(total, 2, true)}`,
    });
  }

  return {
    areas,
    areaFt2: areaTotal,
    volumeFt3: ft3,
    volumeYd3: yd3,
    volumeM3: yd3ToM3(yd3),
    orderVolumeFt3: orderFt3,
    orderVolumeYd3: orderYd3,
    orderVolumeM3: yd3ToM3(orderYd3),
    densityLbFt3: density,
    tonsPerYd3: tonsPerYd3(density),
    weightLb: lb,
    weightTons: tons,
    weightKg: kg,
    weightMetricTons: kg / KG_PER_METRIC_TON,
    bags,
    cost: total,
    steps,
    warnings,
  };
}

function areaExpression(a: AreaInput, units: UnitSystem): string {
  const u = units === 'metric' ? 'm' : 'ft';
  const f = (n: number) => (units === 'metric' ? `${fmt(n, 2)} m → ${fmt(toFeet(n, units), 2)} ft` : `${fmt(n, 2)} ft`);
  switch (a.shape) {
    case 'rectangle':
      return `${f(a.a)} × ${f(a.b ?? 0)}`;
    case 'circle':
      return `π × (${f(a.a)} ÷ 2)²`;
    case 'triangle':
      return `½ × ${f(a.a)} × ${f(a.b ?? 0)}`;
    case 'area':
      return units === 'metric' ? `${fmt(a.a, 2)} m² → ft²` : `${fmt(a.a, 2)} ${u}²`;
  }
}

function depthExpression(depth: number, units: UnitSystem): string {
  return units === 'metric' ? `(${fmt(depth, 2)} cm ÷ 30.48)` : `(${fmt(depth, 2)} in ÷ 12)`;
}

/** Suggested round-up order quantity in yd³ (suppliers deliver in ½-yard increments). */
export function suggestedOrderYd3(orderYd3: number): number {
  if (orderYd3 <= 0) return 0;
  return round(Math.ceil(orderYd3 * 2 - 1e-9) / 2, 1);
}
