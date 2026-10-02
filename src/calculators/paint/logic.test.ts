import { describe, expect, it } from 'vitest';
import {
  calculatePaint,
  computeSurface,
  buyPlan,
  describeBuy,
  ft2PerGalToM2PerL,
  m2PerLToFt2PerGal,
  L_PER_GAL,
  QT_PER_GAL,
  DEFAULT_INPUT,
} from './logic';
import type { PaintInput, SurfaceInput } from './types';

/** Reference examples: docs/briefs/paint-calculator.md §3. */

const room = (patch: Partial<SurfaceInput>): SurfaceInput => ({ id: 'x', name: 'Room', kind: 'room', a: 12, b: 12, c: 8, ceiling: false, doors: 0, windows: 0, qty: 1, ...patch });
const input = (patch: Partial<PaintInput>): PaintInput => ({ ...DEFAULT_INPUT, ...patch });

describe('reference examples (brief §3)', () => {
  it('#1 NIST Handbook 44: 1 U.S. gallon = 231 in³ = 3.785411784 L = 4 quarts', () => {
    expect(L_PER_GAL).toBe(3.785411784);
    expect(231 * 2.54 ** 3 / 1000).toBeCloseTo(L_PER_GAL, 9);
    expect(QT_PER_GAL).toBe(4);
  });

  it('#2 default 12 × 12 ft bedroom, 8 ft walls, 1 door, 1 window: 352 ft² of wall', () => {
    const r = calculatePaint(DEFAULT_INPUT);
    expect(r.wallFt2).toBe(352);
  });

  it('#3 two coats at 350 ft²/gal (S-W ProMar 200 low end) = 2.01 gal → buy 2 gal + 1 qt', () => {
    const r = calculatePaint(DEFAULT_INPUT);
    expect(r.wallGal).toBeCloseTo(704 / 350, 12);
    expect(r.wallBuy).toMatchObject({ buckets: 0, gallons: 2, quarts: 1 });
  });

  it('#4 the same walls at 400 ft²/gal (Benjamin Moore Regal Select low end) = 1.76 gal → 2 gal', () => {
    const r = calculatePaint(input({ coverage: 400 }));
    expect(r.wallGal).toBeCloseTo(1.76, 12);
    expect(describeBuy(r.wallBuy)).toBe('2 gal');
  });

  it('#5 ceiling is totalled separately: 144 ft² × 2 coats ÷ 350 = 0.82 gal → 1 gal', () => {
    const r = calculatePaint(input({ surfaces: [room({ ceiling: true, doors: 1, windows: 1 })] }));
    expect(r.ceilingFt2).toBe(144);
    expect(r.ceilingGal).toBeCloseTo(288 / 350, 12);
    expect(describeBuy(r.ceilingBuy)).toBe('1 gal');
  });

  it('#6 primer on new drywall (S-W spec: 1 coat primer, 2 coats paint): 352 ft² ÷ 350 → 1 gal + 1 qt', () => {
    const r = calculatePaint(input({ primer: true }));
    expect(r.primerGal).toBeCloseTo(352 / 350, 12);
    expect(describeBuy(r.primerBuy)).toBe('1 gal + 1 qt');
  });

  it('#7 single wall 10 × 8 ft with a door = 60 ft²', () => {
    expect(computeSurface({ id: 'w', name: 'Accent', kind: 'wall', a: 10, b: 8, doors: 1, windows: 0, qty: 1 }, DEFAULT_INPUT, 0).wallFt2).toBe(60);
  });

  it('#8 coverage units: 350 ft²/gal = 8.59 m²/L and back', () => {
    expect(ft2PerGalToM2PerL(350)).toBeCloseTo(8.5898, 4);
    expect(m2PerLToFt2PerGal(ft2PerGalToM2PerL(350))).toBeCloseTo(350, 9);
  });

  it('#9 metric room 4 × 3 m, 2.5 m high, door 1.9 m², window 1.1 m² = 32 m² → 7.45 L at 8.59 m²/L', () => {
    const r = calculatePaint(
      input({ units: 'metric', coverage: 8.59, doorArea: 1.9, windowArea: 1.1, surfaces: [room({ a: 4, b: 3, c: 2.5, doors: 1, windows: 1 })] }),
    );
    expect(r.wallFt2 * 0.09290304).toBeCloseTo(32, 9);
    expect(r.wallL).toBeCloseTo((32 * 2) / 8.59, 4);
  });

  it('#10 three identical bedrooms triple the area', () => {
    const r = calculatePaint(input({ surfaces: [room({ doors: 1, windows: 1, qty: 3 })] }));
    expect(r.wallFt2).toBe(352 * 3);
  });
});

describe('buy plan', () => {
  it('rounds up to quarts and packs into buckets, gallons and quarts', () => {
    expect(buyPlan(0)).toEqual({ buckets: 0, gallons: 0, quarts: 0, totalGal: 0 });
    expect(buyPlan(0.2)).toMatchObject({ gallons: 0, quarts: 1 });
    expect(buyPlan(7.2)).toMatchObject({ buckets: 1, gallons: 2, quarts: 1, totalGal: 7.25 });
    expect(buyPlan(10)).toMatchObject({ buckets: 2, gallons: 0, quarts: 0 });
  });

  it('three quarts become one gallon', () => {
    expect(buyPlan(2.6)).toMatchObject({ gallons: 3, quarts: 0, totalGal: 3 });
    expect(describeBuy(buyPlan(5.8))).toBe('1 × 5-gal bucket + 1 gal');
  });
});

describe('edge cases', () => {
  it('doors and windows never make the wall negative, and warn', () => {
    const r = calculatePaint(input({ surfaces: [{ id: 'w', name: 'Hall', kind: 'wall', a: 4, b: 5, doors: 2, windows: 0, qty: 1 }] }));
    expect(r.wallFt2).toBe(0);
    expect(r.warnings.some((w) => /whole wall/.test(w))).toBe(true);
  });

  it('known area is painted as given; invalid inputs give a text error', () => {
    expect(computeSurface({ id: 'a', name: 'Fence', kind: 'area', a: 500, doors: 0, windows: 0, qty: 1 }, DEFAULT_INPUT, 0).wallFt2).toBe(500);
    expect(computeSurface(room({ c: -1 }), DEFAULT_INPUT, 0).error).toBeDefined();
  });

  it('coats are clamped to 1–4 and an unusual coverage warns', () => {
    expect(calculatePaint(input({ coats: 9 })).wallGal).toBeCloseTo((352 * 4) / 350, 12);
    expect(calculatePaint(input({ coverage: 120 })).warnings.some((w) => /unusual/.test(w))).toBe(true);
  });

  it('cost uses the gallons actually bought', () => {
    const r = calculatePaint(input({ price: 40 }));
    expect(r.cost).toBeCloseTo(2.25 * 40, 9);
  });
});
