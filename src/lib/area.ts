/**
 * Plane shapes shared by every area-based calculator (square footage, cubic yards,
 * and later concrete, mulch, topsoil). Pure functions, no UI.
 * Exact factors: NIST SP 811 Appendix B and NIST Handbook 44 Appendix C.
 */

export type UnitSystem = 'imperial' | 'metric';
export type AreaShape = 'rectangle' | 'lshape' | 'circle' | 'ring' | 'triangle' | 'trapezoid' | 'area';
/** Depth / thickness / height unit: in · ft (imperial), cm · m (metric). */
export type DepthUnit = 'in' | 'ft' | 'cm' | 'm';

export const M_PER_FT = 0.3048;
export const FT_PER_M = 1 / M_PER_FT;
export const M2_PER_FT2 = M_PER_FT ** 2; // 0.09290304 exactly
export const FT2_PER_M2 = 1 / M2_PER_FT2;
export const FT2_PER_YD2 = 9;
export const FT2_PER_ACRE = 43560;
export const IN_PER_FT = 12;
export const CM_PER_IN = 2.54;

/** The dimensions of one shape. Field meaning depends on the shape (see `shapeArea`). */
export interface ShapeDims {
  shape: AreaShape;
  /** rectangle: length · lshape: part 1 length · circle / ring: (outer) diameter · triangle: base · trapezoid: side a · area: the area itself */
  a: number;
  /** rectangle: width · lshape: part 1 width · ring: inner diameter (the hole) · triangle: height · trapezoid: side b */
  b?: number;
  /** lshape: part 2 length · trapezoid: height */
  c?: number;
  /** lshape: part 2 width */
  d?: number;
}

/** A length entered in the active unit system, in feet. */
export function toFeet(value: number, units: UnitSystem): number {
  return units === 'metric' ? value * FT_PER_M : value;
}

/** An area entered in ft² or m², in ft². */
export function toSquareFeet(area: number, units: UnitSystem): number {
  return units === 'metric' ? area * FT2_PER_M2 : area;
}

export const ft2ToM2 = (ft2: number): number => ft2 * M2_PER_FT2;

/** A depth in the chosen unit, in feet. */
export function depthToFeet(depth: number, unit: DepthUnit): number {
  switch (unit) {
    case 'in':
      return depth / IN_PER_FT;
    case 'ft':
      return depth;
    case 'cm':
      return depth / (CM_PER_IN * IN_PER_FT);
    case 'm':
      return depth / M_PER_FT;
  }
}

/** Convert a depth between units (used when the user switches the unit). */
export function convertDepth(depth: number, from: DepthUnit, to: DepthUnit): number {
  if (from === to || !Number.isFinite(depth)) return depth;
  const ft = depthToFeet(depth, from);
  switch (to) {
    case 'in':
      return ft * IN_PER_FT;
    case 'ft':
      return ft;
    case 'cm':
      return ft * IN_PER_FT * CM_PER_IN;
    case 'm':
      return ft * M_PER_FT;
  }
}
export const m2ToFt2 = (m2: number): number => m2 * FT2_PER_M2;

function isBad(n: number | undefined): boolean {
  return n == null || !Number.isFinite(n) || n < 0;
}

/**
 * Area of one shape in ft², or NaN with a message a field can show.
 *
 *   rectangle   L × W
 *   L-shape     L₁ × W₁ + L₂ × W₂
 *   circle      π × (D ÷ 2)²
 *   ring        π × ((D ÷ 2)² − (d ÷ 2)²)   e.g. a mulch ring around a tree trunk
 *   triangle    ½ × base × height
 *   trapezoid   (a + b) ÷ 2 × h
 *   area        the value entered
 */
export function shapeAreaFt2(dims: ShapeDims, units: UnitSystem): { areaFt2: number; error?: string } {
  const ft = (n: number) => toFeet(n, units);
  const { a, b, c, d } = dims;
  switch (dims.shape) {
    case 'rectangle':
      if (isBad(a) || isBad(b)) return { areaFt2: NaN, error: 'Enter a length and a width of 0 or more.' };
      return { areaFt2: ft(a) * ft(b!) };
    case 'lshape':
      if (isBad(a) || isBad(b) || isBad(c) || isBad(d)) {
        return { areaFt2: NaN, error: 'Enter both parts of the L: length and width of each.' };
      }
      return { areaFt2: ft(a) * ft(b!) + ft(c!) * ft(d!) };
    case 'circle':
      if (isBad(a)) return { areaFt2: NaN, error: 'Enter a diameter of 0 or more.' };
      return { areaFt2: Math.PI * (ft(a) / 2) ** 2 };
    case 'ring':
      if (isBad(a) || isBad(b)) return { areaFt2: NaN, error: 'Enter an outer and an inner diameter of 0 or more.' };
      if (b! > a) return { areaFt2: NaN, error: 'The inner diameter must be smaller than the outer one.' };
      return { areaFt2: Math.PI * ((ft(a) / 2) ** 2 - (ft(b!) / 2) ** 2) };
    case 'triangle':
      if (isBad(a) || isBad(b)) return { areaFt2: NaN, error: 'Enter a base and a height of 0 or more.' };
      return { areaFt2: 0.5 * ft(a) * ft(b!) };
    case 'trapezoid':
      if (isBad(a) || isBad(b) || isBad(c)) return { areaFt2: NaN, error: 'Enter both parallel sides and the height.' };
      return { areaFt2: ((ft(a) + ft(b!)) / 2) * ft(c!) };
    case 'area':
      if (isBad(a)) return { areaFt2: NaN, error: 'Enter an area of 0 or more.' };
      return { areaFt2: toSquareFeet(a, units) };
  }
}

/** Human-readable formula with the user's numbers, for "How it's calculated". */
export function shapeExpression(dims: ShapeDims, units: UnitSystem, fmt: (n: number, d?: number) => string): string {
  const u = units === 'metric' ? 'm' : 'ft';
  const f = (n: number | undefined) => `${fmt(n ?? 0, 2)} ${u}`;
  switch (dims.shape) {
    case 'rectangle':
      return `${f(dims.a)} × ${f(dims.b)}`;
    case 'lshape':
      return `${f(dims.a)} × ${f(dims.b)} + ${f(dims.c)} × ${f(dims.d)}`;
    case 'circle':
      return `π × (${f(dims.a)} ÷ 2)²`;
    case 'ring':
      return `π × ((${f(dims.a)} ÷ 2)² − (${f(dims.b)} ÷ 2)²)`;
    case 'triangle':
      return `½ × ${f(dims.a)} × ${f(dims.b)}`;
    case 'trapezoid':
      return `(${f(dims.a)} + ${f(dims.b)}) ÷ 2 × ${f(dims.c)}`;
    case 'area':
      return units === 'metric' ? `${fmt(dims.a, 2)} m²` : `${fmt(dims.a, 2)} ft²`;
  }
}

/** Sensible starting dimensions when the user switches to another shape. */
export function withShape<T extends ShapeDims>(dims: T, shape: AreaShape): T {
  const a = Number.isFinite(dims.a) ? dims.a : 10;
  const b = dims.b != null && Number.isFinite(dims.b) ? dims.b : 10;
  switch (shape) {
    case 'rectangle':
    case 'triangle':
      return { ...dims, shape, a, b, c: undefined, d: undefined };
    case 'lshape':
      return { ...dims, shape, a, b, c: dims.c ?? 6, d: dims.d ?? 6 };
    case 'circle':
      return { ...dims, shape, a, b: undefined, c: undefined, d: undefined };
    case 'ring':
      return { ...dims, shape, a, b: Math.min(b, a / 4), c: undefined, d: undefined };
    case 'trapezoid':
      return { ...dims, shape, a, b, c: dims.c ?? 8, d: undefined };
    case 'area':
      return { ...dims, shape, a: a * b, b: undefined, c: undefined, d: undefined };
  }
}

/** URL codes for shapes, shared so links stay short and stable. */
export const SHAPE_CODES: Record<AreaShape, string> = {
  rectangle: 'rect',
  lshape: 'l',
  circle: 'circ',
  ring: 'ring',
  triangle: 'tri',
  trapezoid: 'trap',
  area: 'area',
};
export const CODE_SHAPES: Record<string, AreaShape> = Object.fromEntries(
  Object.entries(SHAPE_CODES).map(([k, v]) => [v, k as AreaShape]),
);
