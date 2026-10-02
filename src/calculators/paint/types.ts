import type { UnitSystem } from '@/lib/area';

export type { UnitSystem } from '@/lib/area';

/** room: four walls from length × width × height (+ ceiling); wall: one wall; area: a known surface area. */
export type SurfaceKind = 'room' | 'wall' | 'area';

export interface SurfaceInput {
  id: string;
  name: string;
  kind: SurfaceKind;
  /** room: length · wall: width · area: the area itself (ft² or m²) */
  a: number;
  /** room: width · wall: height */
  b?: number;
  /** room: wall height */
  c?: number;
  /** Paint the ceiling of this room too (room only). */
  ceiling?: boolean;
  doors: number;
  windows: number;
  /** Identical rooms or walls. */
  qty: number;
}

export interface PaintInput {
  units: UnitSystem;
  surfaces: SurfaceInput[];
  coats: number;
  /** Coverage of one gallon (imperial, ft²) or one litre (metric, m²) per coat. */
  coverage: number;
  /** Add one coat of primer on walls (new drywall, bare surfaces, big colour change). */
  primer: boolean;
  primerCoverage: number;
  /** Size of one door and one window, in ft² (imperial) or m² (metric). */
  doorArea: number;
  windowArea: number;
  /** Price per gallon (imperial) or per litre (metric) of wall paint. */
  price?: number;
}

export interface SurfaceResult {
  id: string;
  name: string;
  kind: SurfaceKind;
  qty: number;
  /** Wall area to paint after doors and windows, ft², all copies. */
  wallFt2: number;
  /** Ceiling area, ft², all copies (0 if not painted). */
  ceilingFt2: number;
  /** Area taken off for doors and windows, ft², all copies. */
  openingsFt2: number;
  error?: string;
}

export interface Step {
  label: string;
  expression: string;
  value: string;
}

/** What to buy, in whole containers: 5-gallon buckets, gallons and quarts. */
export interface BuyPlan {
  buckets: number;
  gallons: number;
  quarts: number;
  /** Total bought, in gallons. */
  totalGal: number;
}

export interface PaintResult {
  surfaces: SurfaceResult[];
  wallFt2: number;
  ceilingFt2: number;
  /** Paint needed in gallons (exact), walls and ceiling separately — they are usually different paints. */
  wallGal: number;
  ceilingGal: number;
  primerGal: number;
  wallBuy: BuyPlan;
  ceilingBuy: BuyPlan;
  primerBuy: BuyPlan;
  wallL: number;
  ceilingL: number;
  primerL: number;
  cost?: number;
  steps: Step[];
  warnings: string[];
}
