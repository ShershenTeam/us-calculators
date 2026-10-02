import { describe, expect, it } from 'vitest';
import {
  calculateConcrete,
  computeElement,
  stairsVolumeFt3,
  bagsNeeded,
  bagsPerYd3,
  bagTable,
  bagById,
  cost,
  wholeQty,
  ft3ToYd3,
  BAGS,
  DENSITY_LB_FT3,
  DEFAULT_INPUT,
} from './logic';
import type { ConcreteInput, ElementInput } from './types';

/** Reference examples: docs/briefs/concrete-calculator.md §3. */

const el = (patch: Partial<ElementInput>): ElementInput => ({ id: 'x', name: 'Pour', kind: 'shape', shape: 'rectangle', a: 0, b: 0, thickness: 0, qty: 1, ...patch });
const input = (patch: Partial<ConcreteInput>): ConcreteInput => ({ ...DEFAULT_INPUT, extraPct: 0, ...patch });

describe('reference examples (brief §3)', () => {
  it('#1 QUIKRETE No. 1101 data sheet: bag yields 0.30 / 0.375 / 0.45 / 0.60 / 0.675 ft³', () => {
    expect(BAGS.map((b) => [b.lb, b.yieldFt3])).toEqual([
      [40, 0.3],
      [50, 0.375],
      [60, 0.45],
      [80, 0.6],
      [90, 0.675],
    ]);
  });

  it('#2 bags per cubic yard from those yields: 90 / 72 / 60 / 45 / 40', () => {
    expect(BAGS.map((b) => bagsPerYd3(b.yieldFt3))).toEqual([90, 72, 60, 45, 40]);
  });

  it('#3 Concrete Network: an 80 lb bag yields about 0.022 yd³', () => {
    expect(ft3ToYd3(bagById('lb80').yieldFt3)).toBeCloseTo(0.0222, 4);
  });

  it('#4 10 × 10 ft slab, 4 in = 33.33 ft³ = 1.23 yd³ (calculator.net, inchcalculator agree)', () => {
    const r = calculateConcrete(input({ elements: [el({ a: 10, b: 10, thickness: 4 })] }));
    expect(r.volumeFt3).toBeCloseTo(33.3333, 4);
    expect(r.volumeYd3).toBeCloseTo(1.2346, 4);
  });

  it('#5 default: same slab +5 % = 35 ft³ → 59 bags of 80 lb, 4,720 lb to carry', () => {
    const r = calculateConcrete(DEFAULT_INPUT);
    expect(r.orderFt3).toBeCloseTo(35, 9);
    expect(r.bags).toBe(59);
    expect(r.bagWeightLb).toBe(4720);
  });

  it('#6 column Ø 12 in × 4 ft = 3.14 ft³ → 6 bags of 80 lb', () => {
    const r = calculateConcrete(input({ depthUnit: 'ft', elements: [el({ shape: 'circle', a: 1, thickness: 4 })] }));
    expect(r.volumeFt3).toBeCloseTo(Math.PI, 9);
    expect(r.bags).toBe(6);
  });

  it('#7 stairs: 3 risers 7 in, treads 11 in, 4 ft wide, 36 in landing = 27.42 ft³', () => {
    const { volumeFt3 } = stairsVolumeFt3({ risers: 3, rise: 7, run: 11, width: 4, platform: 36 }, 'imperial');
    // 4 × (11/12 × 7/12 × 3 + 3 × 3 × 7/12) = 4 × (1.604167 + 5.25)
    expect(volumeFt3).toBeCloseTo(27.416667, 6);
  });

  it('#8 one riser is just the landing: 4 ft × 3 ft × 7 in = 7 ft³', () => {
    expect(stairsVolumeFt3({ risers: 1, rise: 7, run: 11, width: 4, platform: 36 }, 'imperial').volumeFt3).toBeCloseTo(7, 9);
  });

  it('#9 footing 20 ft × 1 ft × 12 in = 20 ft³ = 0.74 yd³', () => {
    const r = calculateConcrete(input({ elements: [el({ a: 20, b: 1, thickness: 12 })] }));
    expect(r.volumeFt3).toBeCloseTo(20, 9);
    expect(r.volumeYd3).toBeCloseTo(0.7407, 4);
  });

  it('#10 metric slab 3 × 3 m × 10 cm = 0.9 m³', () => {
    const r = calculateConcrete(input({ units: 'metric', depthUnit: 'cm', elements: [el({ a: 3, b: 3, thickness: 10 })] }));
    expect(r.volumeM3).toBeCloseTo(0.9, 10);
  });
});

describe('elements', () => {
  it('sums slabs, footings and stairs', () => {
    const r = calculateConcrete(
      input({
        elements: [
          el({ id: 'a', a: 10, b: 10, thickness: 4 }),
          el({ id: 'b', kind: 'stairs', stairs: { risers: 3, rise: 7, run: 11, width: 4, platform: 36 } }),
        ],
      }),
    );
    expect(r.volumeFt3).toBeCloseTo(33.333333 + 27.416667, 5);
  });

  it('quantity multiplies identical pours (post holes)', () => {
    const r = calculateConcrete(input({ depthUnit: 'in', elements: [el({ shape: 'circle', a: 10 / 12, thickness: 36, qty: 8 })] }));
    expect(r.volumeFt3).toBeCloseTo(13.09, 2);
  });

  it('stairs metric: 3 risers 18 cm, treads 28 cm, 1.2 m wide, 90 cm landing', () => {
    const { volumeFt3 } = stairsVolumeFt3({ risers: 3, rise: 18, run: 28, width: 1.2, platform: 90 }, 'metric');
    // 1.2 × (0.28 × 0.18 × 3 + 0.9 × 3 × 0.18) m³ = 1.2 × (0.1512 + 0.486) = 0.76464 m³
    expect(volumeFt3 * 0.3048 ** 3).toBeCloseTo(0.76464, 6);
  });

  it('invalid pours are excluded with a text error', () => {
    const r = calculateConcrete(input({ elements: [el({ id: 'a', a: 10, b: 10, thickness: 4 }), el({ id: 'b', a: 5, b: 5, thickness: -1 })] }));
    expect(r.volumeFt3).toBeCloseTo(33.333333, 5);
    expect(r.elements[1].error).toMatch(/thickness/);
    expect(stairsVolumeFt3({ risers: 3, rise: -1, run: 11, width: 4, platform: 0 }, 'imperial').error).toBeDefined();
  });

  it('blank names fall back to "Pour N"; risers clamp to 1–30', () => {
    expect(computeElement(el({ name: '' }), 'imperial', 'in', 1).name).toBe('Pour 2');
    expect(wholeQty(0, 30)).toBe(1);
    expect(wholeQty(45, 30)).toBe(30);
  });

  it('warns on a slab typed in feet that should be inches, and on a slab under 2 in', () => {
    const feet = calculateConcrete(input({ depthUnit: 'ft', elements: [el({ a: 10, b: 10, thickness: 4 })] }));
    expect(feet.warnings[0]).toMatch(/inches/);
    const thin = calculateConcrete(input({ depthUnit: 'in', elements: [el({ a: 10, b: 10, thickness: 1 })] }));
    expect(thin.warnings[0]).toMatch(/under 2 in/);
    const column = calculateConcrete(input({ depthUnit: 'ft', elements: [el({ shape: 'circle', a: 1, thickness: 8 })] }));
    expect(column.warnings).toHaveLength(0);
  });
});

describe('ordering', () => {
  it('bags round up and the table covers every size', () => {
    expect(bagsNeeded(27, 0.6)).toBe(45);
    expect(bagsNeeded(27.01, 0.6)).toBe(46);
    expect(bagsNeeded(0, 0.6)).toBe(0);
    expect(bagTable(27).map((b) => b.bags)).toEqual([90, 72, 60, 45, 40]);
  });

  it('extra is clamped to 0–50 %', () => {
    const r = calculateConcrete(input({ extraPct: 70, elements: [el({ a: 3, b: 3, thickness: 36 })] }));
    expect(ft3ToYd3(r.orderFt3)).toBeCloseTo(1.5, 12);
  });

  it('cost per bag, per yd³ or per m³', () => {
    expect(cost(27, 45, 6.5, 'bag')).toBeCloseTo(292.5, 9);
    expect(cost(27, 45, 165, 'yd3')).toBeCloseTo(165, 9);
    expect(cost(27, 45, undefined, 'bag')).toBeUndefined();
  });

  it('estimated weight at 140 lb/ft³', () => {
    const r = calculateConcrete(input({ elements: [el({ a: 3, b: 3, thickness: 36 })] }));
    expect(r.concreteWeightLb).toBeCloseTo(27 * DENSITY_LB_FT3, 9);
  });
});
