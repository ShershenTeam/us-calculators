/**
 * Cubic yards calculator — pure functions, no UI.
 * Formula, reference examples and sources: docs/briefs/cubic-yards-calculator.md §3.
 *
 *   area (ft²)     shared shapes, src/lib/area.ts
 *   volume (ft³)   = area × depth (ft) × quantity
 *   cubic yards    = ft³ ÷ 27
 *   to order       = volume × (1 + extra %)
 *   suggested      = to order rounded up to the next ½ yd³
 *   bags           = ceil(to order ft³ ÷ bag size)
 */
import type { AreaInput, AreaResult, CubicYardsInput, CubicYardsResult, DepthUnit, PriceUnit, Step, UnitSystem } from './types';
import { fmt, round } from '@/lib/format';
import { shapeAreaFt2, shapeExpression, depthToFeet, M_PER_FT, IN_PER_FT } from '@/lib/area';

/* Exact factors — NIST SP 811 Appendix B. */
export const FT3_PER_YD3 = 27;
export const M3_PER_FT3 = M_PER_FT ** 3; // 0.028316846592 exactly
export const M3_PER_YD3 = M3_PER_FT3 * FT3_PER_YD3; // 0.764554857984 exactly
export const L_PER_FT3 = M3_PER_FT3 * 1000; // 28.316846592 L

export const MAX_EXTRA_PCT = 50;
export const MAX_QTY = 999;
/** A spread layer deeper than this, entered in ft or m, is probably a unit mistake. */
export const DEEP_LAYER_FT = 2;

/** Common retail bag sizes. Imperial in cubic feet, metric in litres. */
export const BAG_SIZES_FT3 = [0.5, 0.75, 1, 1.5, 2, 3] as const;
export const BAG_SIZES_L = [25, 40, 50, 70] as const;

export const DEFAULT_INPUT: CubicYardsInput = {
  units: 'imperial',
  depthUnit: 'in',
  areas: [{ id: 'a1', name: 'Garden bed', shape: 'rectangle', a: 12, b: 10, depth: 4, qty: 1 }],
  extraPct: 10,
  bagSize: 2,
  priceUnit: 'yd3',
};

/* ---------- unit helpers ---------- */

export const ft3ToYd3 = (ft3: number): number => ft3 / FT3_PER_YD3;
export const yd3ToFt3 = (yd3: number): number => yd3 * FT3_PER_YD3;
export const ft3ToM3 = (ft3: number): number => ft3 * M3_PER_FT3;
export const m3ToFt3 = (m3: number): number => m3 / M3_PER_FT3;
export const yd3ToM3 = (yd3: number): number => yd3 * M3_PER_YD3;

export { depthToFeet, convertDepth } from '@/lib/area';

/** Bag size entered in ft³ (imperial) or litres (metric), in ft³. */
export function bagSizeFt3(size: number, units: UnitSystem): number {
  return units === 'metric' ? size / L_PER_FT3 : size;
}

export function areaQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.round(qty)));
}

/* ---------- geometry ---------- */

function isBad(n: number | undefined): boolean {
  return n == null || !Number.isFinite(n) || n < 0;
}

export function computeArea(area: AreaInput, units: UnitSystem, depthUnit: DepthUnit, index: number): AreaResult {
  const name = area.name.trim() || `Area ${index + 1}`;
  const qty = areaQty(area.qty);
  const base = { id: area.id, name, shape: area.shape, qty };
  const { areaFt2, error } = shapeAreaFt2(area, units);
  if (error) return { ...base, areaFt2: 0, depthFt: 0, volumeFt3: 0, error };
  if (isBad(area.depth)) return { ...base, areaFt2, depthFt: 0, volumeFt3: 0, error: 'Enter a depth of 0 or more.' };
  const depthFt = depthToFeet(area.depth, depthUnit);
  return { ...base, areaFt2, depthFt, volumeFt3: areaFt2 * depthFt * qty };
}

/* ---------- ordering ---------- */

/** Bulk suppliers deliver in ½-yard steps; round up so the order is never short. */
export function suggestedOrderYd3(yd3: number): number {
  if (!(yd3 > 0)) return 0;
  return round(Math.ceil(yd3 * 2 - 1e-9) / 2, 1);
}

export function bagsNeeded(volumeFt3: number, sizeFt3: number): number {
  if (!(sizeFt3 > 0) || !(volumeFt3 > 0)) return 0;
  return Math.ceil(volumeFt3 / sizeFt3 - 1e-9);
}

export function cost(orderFt3: number, bags: number, price: number | undefined, unit: PriceUnit): number | undefined {
  if (price == null || !Number.isFinite(price) || price < 0) return undefined;
  switch (unit) {
    case 'yd3':
      return ft3ToYd3(orderFt3) * price;
    case 'ft3':
      return orderFt3 * price;
    case 'm3':
      return ft3ToM3(orderFt3) * price;
    case 'bag':
      return bags * price;
  }
}

/** ft² one cubic yard covers at a depth in inches: 27 ft³ ÷ (depth ÷ 12). */
export function coveragePerYd3Ft2(depthIn: number): number {
  return depthIn > 0 ? (FT3_PER_YD3 * IN_PER_FT) / depthIn : 0;
}

export const COVERAGE_DEPTHS_IN = [1, 2, 3, 4, 6, 12] as const;

/* ---------- main ---------- */

export function calculateCubicYards(input: CubicYardsInput): CubicYardsResult {
  const { units, depthUnit } = input;
  const areas = input.areas.map((a, i) => computeArea(a, units, depthUnit, i));
  const valid = areas.filter((a) => !a.error);

  const areaFt2 = valid.reduce((s, a) => s + a.areaFt2 * a.qty, 0);
  const ft3 = valid.reduce((s, a) => s + a.volumeFt3, 0);
  const yd3 = ft3ToYd3(ft3);

  const extra = Number.isFinite(input.extraPct) ? Math.min(MAX_EXTRA_PCT, Math.max(0, input.extraPct)) : 0;
  const factor = 1 + extra / 100;
  const orderFt3 = ft3 * factor;
  const orderYd3 = ft3ToYd3(orderFt3);

  const sizeFt3 = bagSizeFt3(input.bagSize, units);
  const bags = bagsNeeded(orderFt3, sizeFt3);
  const total = cost(orderFt3, bags, input.price, input.priceUnit);

  // Common slip: typing a depth in inches while the unit is set to feet (4 → a 4 ft deep bed).
  // Circles are skipped because post holes and sonotubes are legitimately several feet deep.
  const warnings: string[] = [];
  if (depthUnit === 'ft' || depthUnit === 'm') {
    const deep = valid.find((a) => a.depthFt > DEEP_LAYER_FT && a.shape !== 'circle');
    if (deep) warnings.push(`${deep.name} is ${fmt(deep.depthFt, 1)} ft deep. If you meant inches, switch the depth unit.`);
  }

  const metric = units === 'metric';
  const steps: Step[] = [];
  for (const a of valid) {
    const src = input.areas.find((x) => x.id === a.id)!;
    const qtyPart = a.qty > 1 ? ` × ${a.qty}` : '';
    steps.push({
      label: a.name,
      expression: `${shapeExpression(src, units, fmt)} × ${fmt(src.depth, 2)} ${depthUnit}${qtyPart}`,
      value: metric ? `${fmt(ft3ToM3(a.volumeFt3), 3)} m³` : `${fmt(a.volumeFt3, 2)} ft³`,
    });
  }
  if (valid.length > 1) {
    steps.push({
      label: 'Total',
      expression: valid.map((a) => (metric ? fmt(ft3ToM3(a.volumeFt3), 3) : fmt(a.volumeFt3, 2))).join(' + '),
      value: metric ? `${fmt(ft3ToM3(ft3), 3)} m³` : `${fmt(ft3, 2)} ft³`,
    });
  }
  steps.push({ label: 'Cubic yards', expression: `${fmt(ft3, 2)} ft³ ÷ 27`, value: `${fmt(yd3, 3)} yd³` });
  if (extra > 0) {
    steps.push({ label: `+${fmt(extra, 0)}% extra`, expression: `${fmt(yd3, 3)} × ${fmt(factor, 2)}`, value: `${fmt(orderYd3, 3)} yd³` });
  }
  steps.push({ label: metric ? 'Cubic feet' : 'Cubic metres', expression: metric ? `${fmt(ft3ToM3(orderFt3), 3)} m³ ÷ 0.0283168` : `${fmt(orderYd3, 3)} yd³ × 0.764555`, value: metric ? `${fmt(orderFt3, 2)} ft³` : `${fmt(ft3ToM3(orderFt3), 3)} m³` });
  if (bags > 0) {
    steps.push({
      label: 'Bags',
      expression: metric
        ? `⌈${fmt(ft3ToM3(orderFt3) * 1000, 1)} L ÷ ${fmt(input.bagSize, 2)} L⌉`
        : `⌈${fmt(orderFt3, 2)} ft³ ÷ ${fmt(input.bagSize, 2)} ft³⌉`,
      value: `${bags} bags`,
    });
  }
  if (total != null) {
    const qtyText =
      input.priceUnit === 'bag'
        ? `${bags} bags`
        : input.priceUnit === 'yd3'
          ? `${fmt(orderYd3, 3)} yd³`
          : input.priceUnit === 'm3'
            ? `${fmt(ft3ToM3(orderFt3), 3)} m³`
            : `${fmt(orderFt3, 2)} ft³`;
    steps.push({ label: 'Cost', expression: `${qtyText} × $${fmt(input.price!, 2)}`, value: `$${fmt(total, 2, true)}` });
  }

  return {
    areas,
    areaFt2,
    volumeFt3: ft3,
    volumeYd3: yd3,
    volumeM3: ft3ToM3(ft3),
    orderFt3,
    orderYd3,
    orderM3: ft3ToM3(orderFt3),
    suggestedYd3: suggestedOrderYd3(orderYd3),
    bags,
    cost: total,
    steps,
    warnings,
  };
}
