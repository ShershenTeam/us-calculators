import type { AreaShape, DepthUnit, ShapeDims, UnitSystem } from '@/lib/area';

export type { AreaShape as Shape, UnitSystem } from '@/lib/area';

export type { DepthUnit } from '@/lib/area';
export type PriceUnit = 'yd3' | 'ft3' | 'm3' | 'bag';

export interface AreaInput extends ShapeDims {
  id: string;
  /** Shown in the steps and the CSV. Blank falls back to "Area N". */
  name: string;
  shape: AreaShape;
  /** Depth of the layer, or height of a column / depth of a hole, in `depthUnit`. */
  depth: number;
  /** How many identical pieces of these dimensions (post holes, footings). */
  qty: number;
}

export interface CubicYardsInput {
  units: UnitSystem;
  depthUnit: DepthUnit;
  areas: AreaInput[];
  /** 0–50; extra for spreading loss, uneven ground and settling. */
  extraPct: number;
  /** Cubic feet per bag (imperial) or litres per bag (metric). */
  bagSize: number;
  price?: number;
  priceUnit: PriceUnit;
}

export interface AreaResult {
  id: string;
  name: string;
  shape: AreaShape;
  areaFt2: number;
  depthFt: number;
  volumeFt3: number;
  qty: number;
  error?: string;
}

export interface Step {
  label: string;
  expression: string;
  value: string;
}

export interface CubicYardsResult {
  areas: AreaResult[];
  areaFt2: number;
  volumeFt3: number;
  volumeYd3: number;
  volumeM3: number;
  orderFt3: number;
  orderYd3: number;
  orderM3: number;
  /** orderYd3 rounded up to the next ½ yd³, the usual bulk delivery increment. */
  suggestedYd3: number;
  bags: number;
  cost?: number;
  steps: Step[];
  warnings: string[];
}
