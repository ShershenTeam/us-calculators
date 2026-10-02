import { describe, expect, it } from 'vitest';
import {
  calculateCubicYards,
  computeArea,
  convertDepth,
  depthToFeet,
  bagsNeeded,
  bagSizeFt3,
  suggestedOrderYd3,
  coveragePerYd3Ft2,
  cost,
  areaQty,
  ft3ToYd3,
  yd3ToM3,
  M3_PER_YD3,
  M3_PER_FT3,
  L_PER_FT3,
  DEFAULT_INPUT,
} from './logic';
import { parseFeet } from '@/lib/parse-input';
import type { AreaInput, CubicYardsInput } from './types';

/** Reference examples: docs/briefs/cubic-yards-calculator.md §3. */

const area = (patch: Partial<AreaInput>): AreaInput => ({ id: 'x', name: 'Area', shape: 'rectangle', a: 0, b: 0, depth: 0, qty: 1, ...patch });
const input = (patch: Partial<CubicYardsInput>): CubicYardsInput => ({ ...DEFAULT_INPUT, extraPct: 0, ...patch });

describe('reference examples (brief §3)', () => {
  it('#1 NIST SP 811: 1 yd³ = 27 ft³ exactly', () => {
    expect(ft3ToYd3(27)).toBe(1);
  });

  it('#2 NIST SP 811: 1 yd³ = 0.764554857984 m³ exactly (1 yd = 0.9144 m)', () => {
    expect(M3_PER_YD3).toBeCloseTo(0.764554857984, 15);
    expect(yd3ToM3(1)).toBeCloseTo(0.9144 ** 3, 15);
  });

  it('#3 NIST SP 811: 1 ft³ = 28.316846592 L exactly', () => {
    expect(M3_PER_FT3).toBeCloseTo(0.028316846592, 15);
    expect(L_PER_FT3).toBeCloseTo(28.316846592, 10);
  });

  it('#4 calculatorsoup worked example: 54 ft³ ÷ 27 = 2 yd³', () => {
    expect(ft3ToYd3(54)).toBe(2);
  });

  it('#5 10 × 10 ft at 3 in = 25 ft³ = 0.926 yd³ (same as calculatorsoup, omnicalculator, thecalculatorsite)', () => {
    const r = calculateCubicYards(input({ areas: [area({ a: 10, b: 10, depth: 3 })] }));
    expect(r.volumeFt3).toBeCloseTo(25, 12);
    expect(r.volumeYd3).toBeCloseTo(0.925926, 6);
  });

  it('#6 default: 12 × 10 ft bed at 4 in, +10 % → 1.63 yd³, order 2 yd³, 22 bags of 2 ft³', () => {
    const r = calculateCubicYards(DEFAULT_INPUT);
    expect(r.volumeFt3).toBeCloseTo(40, 12);
    expect(r.volumeYd3).toBeCloseTo(1.481481, 6);
    expect(r.orderYd3).toBeCloseTo(1.62963, 5);
    expect(r.suggestedYd3).toBe(2);
    expect(r.bags).toBe(22);
  });

  it(`#7 8 post holes Ø 10" × 36" = 13.09 ft³ = 0.485 yd³`, () => {
    const dia = parseFeet(`10"`);
    const r = calculateCubicYards(input({ depthUnit: 'in', areas: [area({ shape: 'circle', a: dia, depth: 36, qty: 8 })] }));
    expect(r.volumeFt3).toBeCloseTo(13.09, 2);
    expect(r.volumeYd3).toBeCloseTo(0.4848, 4);
  });

  it('#8 one cubic yard covers 108 ft² at 3 in and 162 ft² at 2 in', () => {
    expect(coveragePerYd3Ft2(3)).toBe(108);
    expect(coveragePerYd3Ft2(2)).toBe(162);
    expect(coveragePerYd3Ft2(12)).toBe(27);
  });

  it('#9 metric: 4 m × 3 m × 10 cm = 1.2 m³ → 24 bags of 50 L', () => {
    const r = calculateCubicYards(input({ units: 'metric', depthUnit: 'cm', bagSize: 50, areas: [area({ a: 4, b: 3, depth: 10 })] }));
    expect(r.volumeM3).toBeCloseTo(1.2, 10);
    expect(r.bags).toBe(24);
  });

  it('#10 depth unit conversion: 4 in = 10.16 cm = 1/3 ft', () => {
    expect(convertDepth(4, 'in', 'cm')).toBeCloseTo(10.16, 12);
    expect(convertDepth(4, 'in', 'ft')).toBeCloseTo(1 / 3, 12);
    expect(convertDepth(10.16, 'cm', 'in')).toBeCloseTo(4, 12);
    expect(convertDepth(1, 'm', 'ft')).toBeCloseTo(3.280839895, 9);
  });
});

describe('areas', () => {
  it('different areas with different depths are summed', () => {
    const r = calculateCubicYards(
      input({ areas: [area({ id: 'a', a: 10, b: 10, depth: 3 }), area({ id: 'b', a: 20, b: 5, depth: 6 })] }),
    );
    expect(r.volumeFt3).toBeCloseTo(25 + 50, 12);
    expect(r.areaFt2).toBe(200);
  });

  it('depth in feet for a slab-like hole', () => {
    expect(depthToFeet(2, 'ft')).toBe(2);
    const r = calculateCubicYards(input({ depthUnit: 'ft', areas: [area({ a: 3, b: 3, depth: 3 })] }));
    expect(r.volumeYd3).toBe(1);
  });

  it('invalid areas are excluded but kept, with a text error', () => {
    const r = calculateCubicYards(input({ areas: [area({ id: 'a', a: 10, b: 10, depth: 3 }), area({ id: 'b', a: 5, b: 5, depth: -1 })] }));
    expect(r.volumeFt3).toBeCloseTo(25, 12);
    expect(r.areas[1].error).toMatch(/depth/);
  });

  it('blank names fall back to "Area N"', () => {
    expect(computeArea(area({ name: ' ' }), 'imperial', 'in', 2).name).toBe('Area 3');
  });

  it('quantity is a whole number between 1 and 999', () => {
    expect(areaQty(0)).toBe(1);
    expect(areaQty(3.6)).toBe(4);
    expect(areaQty(5000)).toBe(999);
    expect(areaQty(NaN)).toBe(1);
  });

  it('warns when a spread layer entered in feet is implausibly deep', () => {
    const r = calculateCubicYards(input({ depthUnit: 'ft', areas: [area({ a: 10, b: 10, depth: 4 })] }));
    expect(r.warnings[0]).toMatch(/inches/);
    const holes = calculateCubicYards(input({ depthUnit: 'ft', areas: [area({ shape: 'circle', a: 1, depth: 4 })] }));
    expect(holes.warnings).toHaveLength(0);
  });
});

describe('ordering', () => {
  it('suggested order rounds up to the next half yard', () => {
    expect(suggestedOrderYd3(0)).toBe(0);
    expect(suggestedOrderYd3(0.1)).toBe(0.5);
    expect(suggestedOrderYd3(1.5)).toBe(1.5);
    expect(suggestedOrderYd3(1.51)).toBe(2);
  });

  it('extra is clamped to 0–50 %', () => {
    const r = calculateCubicYards(input({ extraPct: 80, areas: [area({ a: 3, b: 3, depth: 36 })] }));
    expect(r.orderYd3).toBeCloseTo(1.5, 12);
  });

  it('bags round up; metric bag size is in litres', () => {
    expect(bagsNeeded(27, 2)).toBe(14);
    expect(bagsNeeded(27, 0)).toBe(0);
    expect(bagSizeFt3(28.316846592, 'metric')).toBeCloseTo(1, 12);
  });

  it('cost by yd³, ft³, m³ or bag uses the volume with extra', () => {
    expect(cost(27, 14, 40, 'yd3')).toBeCloseTo(40, 12);
    expect(cost(27, 14, 2, 'ft3')).toBeCloseTo(54, 12);
    expect(cost(27, 14, 5, 'bag')).toBe(70);
    expect(cost(27, 14, 50, 'm3')).toBeCloseTo(38.2277, 4);
    expect(cost(27, 14, undefined, 'yd3')).toBeUndefined();
  });
});
