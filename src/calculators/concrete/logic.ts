/**
 * Concrete calculator — pure functions, no UI.
 * Formula, reference examples and sources: docs/briefs/concrete-calculator.md §3.
 *
 *   slab / footing / wall / column   V = plane area (src/lib/area.ts) × thickness × quantity
 *   stairs (N risers)                V = W × [ T × R × N(N−1)/2  +  P × N × R ]
 *                                       (N−1 solid steps of tread T and rising height,
 *                                        plus a top landing of depth P at full height N×R)
 *   cubic yards                      = ft³ ÷ 27
 *   to order                         = volume × (1 + extra %)
 *   bags                             = ceil(to order ft³ ÷ bag yield)
 */
import type { BagCount, BagId, ConcreteInput, ConcreteResult, DepthUnit, ElementInput, ElementResult, PriceUnit, StairsDims, Step, UnitSystem } from './types';
import { fmt } from '@/lib/format';
import { shapeAreaFt2, shapeExpression, depthToFeet, M_PER_FT, IN_PER_FT, CM_PER_IN } from '@/lib/area';

/* Exact factors — NIST SP 811 Appendix B. */
export const FT3_PER_YD3 = 27;
export const M3_PER_FT3 = M_PER_FT ** 3;
export const LB_PER_KG = 1 / 0.45359237;

/**
 * Bag yields — QUIKRETE Concrete Mix No. 1101 product data sheet ("A 40 lb bag yields
 * approximately 0.30 ft³ … an 80 lb bag … 0.60 ft³"). Brief §3.
 */
export const BAGS: readonly { id: BagId; lb: number; yieldFt3: number }[] = [
  { id: 'lb40', lb: 40, yieldFt3: 0.3 },
  { id: 'lb50', lb: 50, yieldFt3: 0.375 },
  { id: 'lb60', lb: 60, yieldFt3: 0.45 },
  { id: 'lb80', lb: 80, yieldFt3: 0.6 },
  { id: 'lb90', lb: 90, yieldFt3: 0.675 },
];

/** Hardened unit weight of the same mix, ≈ 140 lb/ft³ (QUIKRETE No. 1101 data sheet). */
export const DENSITY_LB_FT3 = 140;

export const MAX_EXTRA_PCT = 50;
export const MAX_QTY = 999;
export const MAX_RISERS = 30;

export const DEFAULT_STAIRS_IMPERIAL: StairsDims = { risers: 3, rise: 7, run: 11, width: 4, platform: 36 };
export const DEFAULT_STAIRS_METRIC: StairsDims = { risers: 3, rise: 18, run: 28, width: 1.2, platform: 90 };

export const DEFAULT_INPUT: ConcreteInput = {
  units: 'imperial',
  depthUnit: 'in',
  elements: [{ id: 'e1', name: 'Patio slab', kind: 'shape', shape: 'rectangle', a: 10, b: 10, thickness: 4, qty: 1 }],
  extraPct: 5,
  bag: 'lb80',
  priceUnit: 'bag',
};

/* ---------- unit helpers ---------- */

export const ft3ToYd3 = (ft3: number): number => ft3 / FT3_PER_YD3;
export const ft3ToM3 = (ft3: number): number => ft3 * M3_PER_FT3;

export function bagById(id: BagId) {
  return BAGS.find((b) => b.id === id) ?? BAGS[3];
}

/** A small length on stairs (rise, run, platform) — in (imperial) or cm (metric) — in feet. */
function smallToFeet(v: number, units: UnitSystem): number {
  return units === 'metric' ? v / (CM_PER_IN * IN_PER_FT) : v / IN_PER_FT;
}

/** Stair width — ft (imperial) or m (metric) — in feet. */
function widthToFeet(v: number, units: UnitSystem): number {
  return units === 'metric' ? v / M_PER_FT : v;
}

export function wholeQty(qty: number, max = MAX_QTY): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(max, Math.max(1, Math.round(qty)));
}

function isBad(n: number | undefined): boolean {
  return n == null || !Number.isFinite(n) || n < 0;
}

/* ---------- geometry ---------- */

/** Volume of a flight of solid stairs on grade, in ft³. */
export function stairsVolumeFt3(s: StairsDims, units: UnitSystem): { volumeFt3: number; error?: string } {
  if (isBad(s.rise) || isBad(s.run) || isBad(s.width) || isBad(s.platform)) {
    return { volumeFt3: NaN, error: 'Enter rise, run, width and landing depth of 0 or more.' };
  }
  const n = wholeQty(s.risers, MAX_RISERS);
  const R = smallToFeet(s.rise, units);
  const T = smallToFeet(s.run, units);
  const P = smallToFeet(s.platform, units);
  const W = widthToFeet(s.width, units);
  return { volumeFt3: W * (T * R * ((n * (n - 1)) / 2) + P * n * R) };
}

export function computeElement(el: ElementInput, units: UnitSystem, depthUnit: DepthUnit, index: number): ElementResult {
  const name = el.name.trim() || `Pour ${index + 1}`;
  const qty = wholeQty(el.qty);
  const base = { id: el.id, name, kind: el.kind, shape: el.shape, qty };
  if (el.kind === 'stairs') {
    const { volumeFt3, error } = stairsVolumeFt3(el.stairs ?? (units === 'metric' ? DEFAULT_STAIRS_METRIC : DEFAULT_STAIRS_IMPERIAL), units);
    return error ? { ...base, volumeFt3: 0, error } : { ...base, volumeFt3: volumeFt3 * qty };
  }
  const { areaFt2, error } = shapeAreaFt2(el, units);
  if (error) return { ...base, volumeFt3: 0, error };
  if (isBad(el.thickness)) return { ...base, volumeFt3: 0, error: 'Enter a thickness of 0 or more.' };
  return { ...base, volumeFt3: areaFt2 * depthToFeet(el.thickness, depthUnit) * qty };
}

/* ---------- ordering ---------- */

export function bagsNeeded(volumeFt3: number, yieldFt3: number): number {
  if (!(yieldFt3 > 0) || !(volumeFt3 > 0)) return 0;
  return Math.ceil(volumeFt3 / yieldFt3 - 1e-9);
}

export function bagTable(orderFt3: number): BagCount[] {
  return BAGS.map((b) => ({ id: b.id, lb: b.lb, yieldFt3: b.yieldFt3, bags: bagsNeeded(orderFt3, b.yieldFt3) }));
}

/** Bags of each size in one cubic yard: 27 ÷ yield. */
export function bagsPerYd3(yieldFt3: number): number {
  return FT3_PER_YD3 / yieldFt3;
}

export function cost(orderFt3: number, bags: number, price: number | undefined, unit: PriceUnit): number | undefined {
  if (price == null || !Number.isFinite(price) || price < 0) return undefined;
  switch (unit) {
    case 'yd3':
      return ft3ToYd3(orderFt3) * price;
    case 'm3':
      return ft3ToM3(orderFt3) * price;
    case 'bag':
      return bags * price;
  }
}

/* ---------- main ---------- */

export function calculateConcrete(input: ConcreteInput): ConcreteResult {
  const { units, depthUnit } = input;
  const elements = input.elements.map((e, i) => computeElement(e, units, depthUnit, i));
  const valid = elements.filter((e) => !e.error);

  const ft3 = valid.reduce((s, e) => s + e.volumeFt3, 0);
  const extra = Number.isFinite(input.extraPct) ? Math.min(MAX_EXTRA_PCT, Math.max(0, input.extraPct)) : 0;
  const factor = 1 + extra / 100;
  const orderFt3 = ft3 * factor;

  const bag = bagById(input.bag);
  const bags = bagsNeeded(orderFt3, bag.yieldFt3);
  const total = cost(orderFt3, bags, input.price, input.priceUnit);

  // Common slips: a slab thickness typed in inches while the unit is feet, or a slab thinner than any mix allows.
  const warnings: string[] = [];
  for (const [i, e] of input.elements.entries()) {
    if (e.kind !== 'shape' || e.shape === 'circle' || e.shape === 'ring' || isBad(e.thickness)) continue;
    const tIn = depthToFeet(e.thickness, depthUnit) * IN_PER_FT;
    const name = elements[i].name;
    if ((depthUnit === 'ft' || depthUnit === 'm') && tIn > 24) {
      warnings.push(`${name} is ${fmt(tIn / 12, 1)} ft thick. If you meant inches, switch the thickness unit.`);
    } else if (tIn > 0 && tIn < 2) {
      warnings.push(`${name} is under 2 in thick — too thin for a concrete slab; check the unit.`);
    }
  }

  const metric = units === 'metric';
  const v = (f: number) => (metric ? `${fmt(ft3ToM3(f), 3)} m³` : `${fmt(f, 2)} ft³`);
  const steps: Step[] = [];
  for (const e of valid) {
    const src = input.elements.find((x) => x.id === e.id)!;
    const qtyPart = e.qty > 1 ? ` × ${e.qty}` : '';
    let expression: string;
    if (src.kind === 'stairs' && src.stairs) {
      const s = src.stairs;
      const sm = metric ? 'cm' : 'in';
      const w = metric ? 'm' : 'ft';
      expression = `${fmt(s.width, 2)} ${w} × (${fmt(s.run, 2)} × ${fmt(s.rise, 2)} ${sm} × ${wholeQty(s.risers, MAX_RISERS) * (wholeQty(s.risers, MAX_RISERS) - 1) / 2} + ${fmt(s.platform, 2)} × ${wholeQty(s.risers, MAX_RISERS)} × ${fmt(s.rise, 2)} ${sm})`;
    } else {
      expression = `${shapeExpression(src, units, fmt)} × ${fmt(src.thickness, 2)} ${depthUnit}`;
    }
    steps.push({ label: e.name, expression: `${expression}${qtyPart}`, value: v(e.volumeFt3) });
  }
  if (valid.length > 1) steps.push({ label: 'Total', expression: valid.map((e) => v(e.volumeFt3)).join(' + '), value: v(ft3) });
  steps.push({ label: 'Cubic yards', expression: `${fmt(ft3, 2)} ft³ ÷ 27`, value: `${fmt(ft3ToYd3(ft3), 3)} yd³` });
  if (extra > 0) steps.push({ label: `+${fmt(extra, 0)}% extra`, expression: `${fmt(ft3ToYd3(ft3), 3)} × ${fmt(factor, 2)}`, value: `${fmt(ft3ToYd3(orderFt3), 3)} yd³` });
  if (bags > 0) steps.push({ label: `${bag.lb} lb bags`, expression: `⌈${fmt(orderFt3, 2)} ft³ ÷ ${fmt(bag.yieldFt3, 3)} ft³⌉`, value: `${bags} bags` });
  if (total != null) {
    const qtyText = input.priceUnit === 'bag' ? `${bags} bags` : input.priceUnit === 'm3' ? `${fmt(ft3ToM3(orderFt3), 3)} m³` : `${fmt(ft3ToYd3(orderFt3), 3)} yd³`;
    steps.push({ label: 'Cost', expression: `${qtyText} × $${fmt(input.price!, 2)}`, value: `$${fmt(total, 2, true)}` });
  }

  return {
    elements,
    volumeFt3: ft3,
    volumeYd3: ft3ToYd3(ft3),
    volumeM3: ft3ToM3(ft3),
    orderFt3,
    orderYd3: ft3ToYd3(orderFt3),
    orderM3: ft3ToM3(orderFt3),
    bags,
    bagTable: bagTable(orderFt3),
    bagWeightLb: bags * bag.lb,
    concreteWeightLb: orderFt3 * DENSITY_LB_FT3,
    cost: total,
    steps,
    warnings,
  };
}
