/**
 * Mulch calculator — pure functions, no UI.
 * Formula, reference examples and sources: docs/briefs/mulch-calculator.md §3.
 *
 * Volume is the cubic-yards engine (src/calculators/cubic-yards/logic.ts) with one mulch-specific
 * step in front of it — a top-up over mulch that is already there:
 *
 *   depth to add  = max(0, target depth − existing depth)
 *   volume (ft³)  = area × depth to add × quantity
 *   cubic yards   = ft³ ÷ 27,  bags = ceil(ft³ ÷ bag size),  bulk order rounded up to ½ yd³
 */
import { calculateCubicYards, L_PER_FT3, FT3_PER_YD3 } from '@/calculators/cubic-yards/logic';
import type { CubicYardsResult } from '@/calculators/cubic-yards/types';
import { convertDepth } from '@/lib/area';
import type { MulchInput } from './types';

/** Common bag sizes. Imperial in cubic feet; metric bags are sold in litres (2 ft³ ≈ 56 L). */
export const BAG_SIZES_FT3 = [1, 1.5, 2, 3] as const;
export const BAG_SIZES_L = [28, 42, 56, 85] as const;

export const MAX_EXTRA_PCT = 50;
/** Oregon State Extension (EC 1629): "wood chips should not exceed 4 inches"; bark no more than 3. */
export const MAX_SENSIBLE_DEPTH_IN = 4;

/**
 * Typical depths, read on the extension pages (brief §3): Illinois "a 2 to 3 inch layer";
 * Maryland "from one to three inches"; Oregon State 3–4 in of arborist chips, bark no more than 3 in.
 */
export const DEPTH_PRESETS_IN = [
  { id: 'fine', label: 'Fine 2 in', in: 2, note: 'Shredded bark, pine needles, fine mulch' },
  { id: 'standard', label: 'Standard 3 in', in: 3, note: 'Most beds and tree rings' },
  { id: 'coarse', label: 'Coarse 4 in', in: 4, note: 'Coarse wood or arborist chips' },
] as const;

export const DEFAULT_INPUT: MulchInput = {
  units: 'imperial',
  depthUnit: 'in',
  areas: [{ id: 'm1', name: 'Front bed', shape: 'rectangle', a: 20, b: 4, depth: 3, qty: 1 }],
  existingDepth: 0,
  extraPct: 0,
  bagSize: 2,
  priceUnit: 'bag',
};

export interface MulchResult extends CubicYardsResult {
  /** Depth actually added to each area after the existing layer, in the input depth unit. */
  addedDepths: number[];
}

/** Depth to add on top of an existing layer, never negative. */
export function depthToAdd(target: number, existing: number): number {
  if (!Number.isFinite(target)) return target;
  const e = Number.isFinite(existing) && existing > 0 ? existing : 0;
  return Math.max(0, target - e);
}

/** ft² one bag covers at a depth in inches: bag ft³ ÷ (depth ÷ 12). */
export function bagCoverageFt2(bagFt3: number, depthIn: number): number {
  return depthIn > 0 ? (bagFt3 * 12) / depthIn : 0;
}

/** Bags of a given size in one cubic yard. */
export function bagsPerYd3(bagFt3: number): number {
  return FT3_PER_YD3 / bagFt3;
}

export function calculateMulch(input: MulchInput): MulchResult {
  // Existing mulch is entered in the same depth unit as the target depth.
  const addedDepths = input.areas.map((a) => depthToAdd(a.depth, input.existingDepth));
  const engine = calculateCubicYards({
    units: input.units,
    depthUnit: input.depthUnit,
    areas: input.areas.map((a, i) => ({ ...a, depth: addedDepths[i] })),
    extraPct: input.extraPct,
    bagSize: input.bagSize,
    price: input.price,
    priceUnit: input.priceUnit,
  });

  const warnings = [...engine.warnings];
  if (input.existingDepth > 0 && addedDepths.every((d) => d === 0)) {
    warnings.push('The existing mulch is already as deep as the target — nothing to add.');
  }
  const maxIn = Math.max(0, ...input.areas.map((a) => convertDepth(a.depth, input.depthUnit, 'in')).filter(Number.isFinite));
  if (maxIn > MAX_SENSIBLE_DEPTH_IN) {
    warnings.push(`${Math.round(maxIn * 10) / 10} in is deeper than extension services advise (1–4 in; wood chips no more than 4 in).`);
  }

  return { ...engine, warnings, addedDepths };
}

export { L_PER_FT3 };
