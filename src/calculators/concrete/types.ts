import type { AreaShape, DepthUnit, ShapeDims, UnitSystem } from '@/lib/area';

export type { AreaShape as Shape, UnitSystem } from '@/lib/area';

export type { DepthUnit } from '@/lib/area';
export type PriceUnit = 'yd3' | 'm3' | 'bag';
export type BagId = 'lb40' | 'lb50' | 'lb60' | 'lb80' | 'lb90';

/** One pour: a slab / footing / wall / column of any plane shape × thickness, or a flight of stairs. */
export type ElementKind = 'shape' | 'stairs';

export interface StairsDims {
  /** Number of risers (steps up), whole number. */
  risers: number;
  /** Height of one riser — in (imperial) or cm (metric). */
  rise: number;
  /** Depth of one tread — in or cm. */
  run: number;
  /** Width of the flight — ft or m. */
  width: number;
  /** Depth of the landing at the top — in or cm. 0 when there is none. */
  platform: number;
}

export interface ElementInput extends ShapeDims {
  id: string;
  name: string;
  kind: ElementKind;
  shape: AreaShape;
  /** Slab thickness, footing depth, wall height or column height, in `depthUnit`. */
  thickness: number;
  qty: number;
  stairs?: StairsDims;
}

export interface ConcreteInput {
  units: UnitSystem;
  depthUnit: DepthUnit;
  elements: ElementInput[];
  /** 0–50; margin so the pour does not run short. */
  extraPct: number;
  bag: BagId;
  price?: number;
  priceUnit: PriceUnit;
}

export interface ElementResult {
  id: string;
  name: string;
  kind: ElementKind;
  shape: AreaShape;
  qty: number;
  volumeFt3: number;
  error?: string;
}

export interface Step {
  label: string;
  expression: string;
  value: string;
}

export interface BagCount {
  id: BagId;
  lb: number;
  yieldFt3: number;
  bags: number;
}

export interface ConcreteResult {
  elements: ElementResult[];
  volumeFt3: number;
  volumeYd3: number;
  volumeM3: number;
  orderFt3: number;
  orderYd3: number;
  orderM3: number;
  /** Bags of the chosen size. */
  bags: number;
  /** Bags of every size, for the comparison table. */
  bagTable: BagCount[];
  /** Weight of the chosen bags, lb. */
  bagWeightLb: number;
  /** Estimated weight of the poured concrete at the manufacturer's density, lb. */
  concreteWeightLb: number;
  cost?: number;
  steps: Step[];
  warnings: string[];
}
