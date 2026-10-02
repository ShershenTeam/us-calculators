import type { AreaInput, PriceUnit } from '@/calculators/cubic-yards/types';
import type { DepthUnit, UnitSystem } from '@/lib/area';

export type { AreaInput, PriceUnit } from '@/calculators/cubic-yards/types';
export type { AreaShape as Shape, DepthUnit, UnitSystem } from '@/lib/area';

export interface MulchInput {
  units: UnitSystem;
  depthUnit: DepthUnit;
  /** Beds, borders and tree rings; `depth` is the target depth of mulch. */
  areas: AreaInput[];
  /** Mulch already on the beds, in `depthUnit`; only the difference is ordered. */
  existingDepth: number;
  /** 0–50. */
  extraPct: number;
  /** Cubic feet per bag (imperial) or litres per bag (metric). */
  bagSize: number;
  price?: number;
  priceUnit: PriceUnit;
}
