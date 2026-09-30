import { describe, it, expect } from 'vitest';
import {
  calculateGravel,
  DEFAULT_INPUT,
  yd3ToM3,
  lbToTons,
  tonsPerYd3,
  bagsNeeded,
  coveragePerTonFt2,
  coveragePerYd3Ft2,
  suggestedOrderYd3,
  computeArea,
  kgM3ToLbFt3,
} from './logic';
import type { GravelInput } from './types';

const base = (over: Partial<GravelInput>): GravelInput => ({ ...DEFAULT_INPUT, wastePct: 0, ...over });

describe('gravel reference examples (docs/briefs/gravel-calculator.md §3)', () => {
  it('#1 10 × 10 ft × 3 in = 25 ft³ = 0.926 yd³', () => {
    const r = calculateGravel(base({ areas: [{ id: 'a', shape: 'rectangle', a: 10, b: 10, depth: 3 }] }));
    expect(r.volumeFt3).toBeCloseTo(25, 9);
    expect(r.volumeYd3).toBeCloseTo(0.925926, 5);
  });

  it('#2 NIST: 1 yd³ = 0.764554857984 m³ exactly', () => {
    expect(yd3ToM3(1)).toBeCloseTo(0.764554857984, 12);
  });

  it('#3 DOT #57 rodded 92 lb/ft³ → 1 yd³ = 2,484 lb = 1.242 short tons', () => {
    const r = calculateGravel(
      base({
        areas: [{ id: 'a', shape: 'area', a: 27, depth: 12 }], // exactly 1 yd³
        gravelTypeId: 'custom',
        customDensityLbFt3: 92,
      }),
    );
    expect(r.volumeYd3).toBeCloseTo(1, 9);
    expect(r.weightLb).toBeCloseTo(2484, 6);
    expect(r.weightTons).toBeCloseTo(1.242, 6);
    expect(tonsPerYd3(92)).toBeCloseTo(1.242, 6);
  });

  it('#4 20 × 10 ft × 4 in at 105 lb/ft³ = 2.469 yd³, 7,000 lb = 3.5 tons', () => {
    const r = calculateGravel(base({ areas: [{ id: 'a', shape: 'rectangle', a: 20, b: 10, depth: 4 }] }));
    expect(r.volumeFt3).toBeCloseTo(66.6667, 3);
    expect(r.volumeYd3).toBeCloseTo(2.469, 3);
    expect(r.weightLb).toBeCloseTo(7000, 3);
    expect(r.weightTons).toBeCloseTo(3.5, 6);
  });

  it('#5 circle D = 8 ft, 2 in = 8.378 ft³ = 0.3103 yd³', () => {
    const r = calculateGravel(base({ areas: [{ id: 'a', shape: 'circle', a: 8, depth: 2 }] }));
    expect(r.areaFt2).toBeCloseTo(50.2655, 3);
    expect(r.volumeFt3).toBeCloseTo(8.3776, 3);
    expect(r.volumeYd3).toBeCloseTo(0.3103, 4);
  });

  it('#6 10 × 10 × 3 in with +10% = 27.5 ft³ = 1.0185 yd³ = 55 bags of 0.5 ft³', () => {
    const r = calculateGravel(base({ wastePct: 10, areas: [{ id: 'a', shape: 'rectangle', a: 10, b: 10, depth: 3 }] }));
    expect(r.orderVolumeFt3).toBeCloseTo(27.5, 9);
    expect(r.orderVolumeYd3).toBeCloseTo(1.0185, 4);
    expect(r.bags).toBe(55);
  });

  it('#7 triangle 12 × 9 ft, 3 in = 54 ft² → 13.5 ft³ = 0.5 yd³', () => {
    const r = calculateGravel(base({ areas: [{ id: 'a', shape: 'triangle', a: 12, b: 9, depth: 3 }] }));
    expect(r.areaFt2).toBeCloseTo(54, 9);
    expect(r.volumeYd3).toBeCloseTo(0.5, 9);
  });

  it('#8 NIST Handbook 44: 1,000 lb = 0.5 short ton', () => {
    expect(lbToTons(1000)).toBe(0.5);
  });

  it('#9 price $45/yd³ × 2.469 yd³ = $111.11', () => {
    const r = calculateGravel(base({ areas: [{ id: 'a', shape: 'rectangle', a: 20, b: 10, depth: 4 }], price: 45, priceUnit: 'yd3' }));
    expect(r.cost).toBeCloseTo(111.11, 2);
  });

  it('#9b price per ton uses order weight', () => {
    const r = calculateGravel(base({ areas: [{ id: 'a', shape: 'rectangle', a: 20, b: 10, depth: 4 }], price: 40, priceUnit: 'ton' }));
    expect(r.cost).toBeCloseTo(140, 6);
  });
});

describe('multiple areas', () => {
  it('sums rectangle + circle and lists each contribution', () => {
    const r = calculateGravel(
      base({
        areas: [
          { id: 'a', shape: 'rectangle', a: 10, b: 10, depth: 3 },
          { id: 'b', shape: 'circle', a: 8, depth: 2 },
        ],
      }),
    );
    expect(r.areas).toHaveLength(2);
    expect(r.volumeFt3).toBeCloseTo(25 + 8.3776, 3);
    expect(r.steps.some((s) => s.label === 'Total volume')).toBe(true);
  });

  it('excludes an invalid area from totals but reports it', () => {
    const r = calculateGravel(
      base({
        areas: [
          { id: 'a', shape: 'rectangle', a: 10, b: 10, depth: 3 },
          { id: 'b', shape: 'rectangle', a: -5, b: 10, depth: 3 },
        ],
      }),
    );
    expect(r.areas[1].error).toMatch(/0 or more/);
    expect(r.volumeFt3).toBeCloseTo(25, 9);
  });
});

describe('metric input', () => {
  it('3 m × 3 m × 7.5 cm ≈ 0.675 m³', () => {
    const r = calculateGravel(base({ units: 'metric', areas: [{ id: 'a', shape: 'rectangle', a: 3, b: 3, depth: 7.5 }] }));
    expect(r.volumeM3).toBeCloseTo(0.675, 6);
  });
  it('1600 kg/m³ ≈ 99.88 lb/ft³', () => {
    expect(kgM3ToLbFt3(1600)).toBeCloseTo(99.885, 2);
  });
});

describe('edge cases', () => {
  it('zero depth gives zero volume and no error', () => {
    const r = calculateGravel(base({ areas: [{ id: 'a', shape: 'rectangle', a: 10, b: 10, depth: 0 }] }));
    expect(r.volumeFt3).toBe(0);
    expect(r.areas[0].error).toBeUndefined();
    expect(r.bags).toBe(0);
  });

  it('negative width is an error', () => {
    expect(computeArea({ id: 'a', shape: 'rectangle', a: 10, b: -1, depth: 3 }, 'imperial').error).toBeDefined();
  });

  it('NaN (empty field) is an error, not a crash', () => {
    expect(computeArea({ id: 'a', shape: 'circle', a: NaN, depth: 3 }, 'imperial').error).toBeDefined();
  });

  it('very large numbers stay finite', () => {
    const r = calculateGravel(base({ areas: [{ id: 'a', shape: 'rectangle', a: 1_000_000, b: 1_000_000, depth: 12 }] }));
    expect(Number.isFinite(r.weightTons)).toBe(true);
    expect(r.volumeYd3).toBeCloseTo(1e12 / 27, 0);
  });

  it('tiny volume still needs 1 bag', () => {
    expect(bagsNeeded(0.01, 0.5)).toBe(1);
    expect(bagsNeeded(1, 0.5)).toBe(2);
    expect(bagsNeeded(0, 0.5)).toBe(0);
  });

  it('waste is clamped to 0–50', () => {
    const r = calculateGravel(base({ wastePct: 500, areas: [{ id: 'a', shape: 'area', a: 27, depth: 12 }] }));
    expect(r.orderVolumeYd3).toBeCloseTo(1.5, 9);
  });

  it('custom density out of range produces a warning but is used', () => {
    const r = calculateGravel(base({ gravelTypeId: 'custom', customDensityLbFt3: 300, areas: [{ id: 'a', shape: 'area', a: 27, depth: 12 }] }));
    expect(r.warnings[0]).toMatch(/outside/);
    expect(r.weightLb).toBeCloseTo(8100, 6);
  });

  it('unknown gravel type falls back to default density', () => {
    const r = calculateGravel(base({ gravelTypeId: 'nope', areas: [{ id: 'a', shape: 'area', a: 27, depth: 12 }] }));
    expect(r.densityLbFt3).toBe(105);
  });
});

describe('coverage tables (FAQ numbers)', () => {
  it('1 yd³ covers 324 ft² at 1 in, 81 ft² at 4 in', () => {
    expect(coveragePerYd3Ft2(1)).toBeCloseTo(324, 9);
    expect(coveragePerYd3Ft2(4)).toBeCloseTo(81, 9);
  });
  it('1 ton at 105 lb/ft³ covers ≈ 114 ft² at 2 in, 57 ft² at 4 in', () => {
    expect(coveragePerTonFt2(105, 2)).toBeCloseTo(114.29, 2);
    expect(coveragePerTonFt2(105, 4)).toBeCloseTo(57.14, 2);
  });
  it('suggested order rounds up to the next half yard', () => {
    expect(suggestedOrderYd3(1.0185)).toBe(1.5);
    expect(suggestedOrderYd3(2.469)).toBe(2.5);
    expect(suggestedOrderYd3(3)).toBe(3);
    expect(suggestedOrderYd3(0)).toBe(0);
  });
});
