export type Shape = 'rectangle' | 'circle' | 'triangle' | 'area';
export type UnitSystem = 'imperial' | 'metric';
export type PriceUnit = 'yd3' | 'ton';

export interface AreaInput {
  id: string;
  shape: Shape;
  /** rectangle: length · circle: diameter · triangle: base · area: the area itself */
  a: number;
  /** rectangle: width · triangle: height · unused otherwise */
  b?: number;
  /** inches (imperial) or centimetres (metric) */
  depth: number;
}

export interface GravelInput {
  units: UnitSystem;
  areas: AreaInput[];
  gravelTypeId: string;
  /** Used when gravelTypeId === 'custom'. Always stored in lb/ft³. */
  customDensityLbFt3?: number;
  /** 0–50, default 10 */
  wastePct: number;
  /** cubic feet per bag, default 0.5 */
  bagSizeFt3: number;
  price?: number;
  priceUnit: PriceUnit;
}

export interface AreaResult {
  id: string;
  shape: Shape;
  areaFt2: number;
  volumeFt3: number;
  volumeYd3: number;
  /** Text error when inputs are invalid; the area is then excluded from totals. */
  error?: string;
}

export interface Step {
  label: string;
  expression: string;
  value: string;
}

export interface GravelResult {
  areas: AreaResult[];
  areaFt2: number;
  volumeFt3: number;
  volumeYd3: number;
  volumeM3: number;
  orderVolumeFt3: number;
  orderVolumeYd3: number;
  orderVolumeM3: number;
  densityLbFt3: number;
  tonsPerYd3: number;
  weightLb: number;
  weightTons: number;
  weightKg: number;
  weightMetricTons: number;
  bags: number;
  cost?: number;
  steps: Step[];
  /** Any warnings (non-blocking), e.g. unusual depth or density. */
  warnings: string[];
}
