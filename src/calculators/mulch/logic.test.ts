import { describe, expect, it } from 'vitest';
import { calculateMulch, depthToAdd, bagCoverageFt2, bagsPerYd3, DEFAULT_INPUT, L_PER_FT3, MAX_SENSIBLE_DEPTH_IN } from './logic';
import type { AreaInput, MulchInput } from './types';

/** Reference examples: docs/briefs/mulch-calculator.md §3. */

const area = (patch: Partial<AreaInput>): AreaInput => ({ id: 'x', name: 'Bed', shape: 'rectangle', a: 0, b: 0, depth: 0, qty: 1, ...patch });
const input = (patch: Partial<MulchInput>): MulchInput => ({ ...DEFAULT_INPUT, extraPct: 0, existingDepth: 0, ...patch });

describe('reference examples (brief §3)', () => {
  it('#1 NIST: 1 yd³ = 27 ft³ → 13.5 bags of 2 ft³, 9 bags of 3 ft³', () => {
    expect(bagsPerYd3(2)).toBe(13.5);
    expect(bagsPerYd3(3)).toBe(9);
  });

  it('#2 a 2 ft³ bag covers 12 ft² at 2 in and 8 ft² at 3 in', () => {
    expect(bagCoverageFt2(2, 2)).toBe(12);
    expect(bagCoverageFt2(2, 3)).toBe(8);
    expect(bagCoverageFt2(3, 3)).toBe(12);
  });

  it('#3 default: 20 × 4 ft bed at 3 in = 20 ft³ = 0.74 yd³ → 10 bags of 2 ft³', () => {
    const r = calculateMulch(DEFAULT_INPUT);
    expect(r.volumeFt3).toBeCloseTo(20, 12);
    expect(r.volumeYd3).toBeCloseTo(0.7407, 4);
    expect(r.bags).toBe(10);
    expect(r.suggestedYd3).toBe(1);
  });

  it('#4 Illinois Extension tree ring: Ø 3 ft circle, 3 in deep, trunk Ø 6 in left bare = 1.72 ft³', () => {
    const r = calculateMulch(input({ areas: [area({ shape: 'ring', a: 3, b: 0.5, depth: 3 })] }));
    // π × (1.5² − 0.25²) × 0.25
    expect(r.volumeFt3).toBeCloseTo(Math.PI * (2.25 - 0.0625) * 0.25, 9);
    expect(r.bags).toBe(1);
  });

  it('#5 top-up: 1 in already there, 3 in wanted → 2 in added (decomposed mulch is replenished)', () => {
    const r = calculateMulch(input({ existingDepth: 1, areas: [area({ a: 20, b: 4, depth: 3 })] }));
    expect(r.addedDepths).toEqual([2]);
    expect(r.volumeFt3).toBeCloseTo(80 * (2 / 12), 12);
  });

  it('#6 1,000 ft² at 2 in = 166.7 ft³ = 6.17 yd³ → 84 bags of 2 ft³', () => {
    const r = calculateMulch(input({ areas: [area({ shape: 'area', a: 1000, depth: 2 })] }));
    expect(r.volumeYd3).toBeCloseTo(6.1728, 4);
    expect(r.bags).toBe(84);
    expect(r.suggestedYd3).toBe(6.5);
  });

  it('#7 metric: 10 m² at 7.5 cm = 0.75 m³ → 14 bags of 56 L', () => {
    const r = calculateMulch(input({ units: 'metric', depthUnit: 'cm', bagSize: 56, areas: [area({ shape: 'area', a: 10, depth: 7.5 })] }));
    expect(r.volumeM3).toBeCloseTo(0.75, 10);
    expect(r.bags).toBe(Math.ceil(750 / 56));
  });

  it('#8 a 2 ft³ bag is 56.6 L (NIST: 1 ft³ = 28.316846592 L)', () => {
    expect(2 * L_PER_FT3).toBeCloseTo(56.634, 3);
  });
});

describe('top-up and warnings', () => {
  it('depth to add never goes below zero and ignores a bad existing value', () => {
    expect(depthToAdd(3, 4)).toBe(0);
    expect(depthToAdd(3, NaN)).toBe(3);
    expect(depthToAdd(3, -1)).toBe(3);
  });

  it('warns when the existing layer already reaches the target', () => {
    const r = calculateMulch(input({ existingDepth: 3, areas: [area({ a: 10, b: 10, depth: 3 })] }));
    expect(r.volumeFt3).toBe(0);
    expect(r.warnings.some((w) => /nothing to add/.test(w))).toBe(true);
  });

  it(`warns above ${MAX_SENSIBLE_DEPTH_IN} in, the Oregon State limit for wood chips`, () => {
    expect(calculateMulch(input({ areas: [area({ a: 10, b: 10, depth: 6 })] })).warnings.some((w) => /4 in/.test(w))).toBe(true);
    expect(calculateMulch(input({ areas: [area({ a: 10, b: 10, depth: 4 })] })).warnings).toHaveLength(0);
  });

  it('different beds keep their own depth', () => {
    const r = calculateMulch(input({ areas: [area({ id: 'a', a: 10, b: 4, depth: 2 }), area({ id: 'b', a: 10, b: 4, depth: 4 })] }));
    expect(r.volumeFt3).toBeCloseTo(40 * (2 / 12) + 40 * (4 / 12), 12);
  });
});
