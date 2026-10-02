import { describe, expect, it } from 'vitest';
import {
  calculateSquareFootage,
  roomAreaFt2,
  boxesNeeded,
  ft2ToM2,
  ft2ToYd2,
  acresToFt2,
  ft2ToAcres,
  m2ToFt2,
  cost,
  roomQty,
  DEFAULT_INPUT,
  M2_PER_FT2,
} from './logic';
import { parseFeet } from '@/lib/parse-input';
import type { RoomInput, SquareFootageInput } from './types';

/** Reference examples: docs/briefs/square-footage-calculator.md §3. */

const room = (patch: Partial<RoomInput>): RoomInput => ({ id: 'x', name: 'Room', shape: 'rectangle', a: 0, b: 0, qty: 1, ...patch });
const input = (patch: Partial<SquareFootageInput>): SquareFootageInput => ({ ...DEFAULT_INPUT, wastePct: 0, ...patch });

describe('reference examples (brief §3)', () => {
  it('#1 12 ft × 14 ft = 168 ft² (matches calculatorsoup, calculator.net, omnicalculator)', () => {
    expect(roomAreaFt2(room({ a: 12, b: 14 }), 'imperial').areaFt2).toBe(168);
  });

  it('#2 NIST SP 811: 1 ft² = 0.09290304 m² exactly (1 ft = 0.3048 m)', () => {
    expect(M2_PER_FT2).toBeCloseTo(0.09290304, 15);
    expect(ft2ToM2(1)).toBeCloseTo(0.09290304, 15);
  });

  it('#3 NIST SP 811: 1 yd² = 9 ft² exactly', () => {
    expect(ft2ToYd2(9)).toBe(1);
  });

  it('#4 NIST Handbook 44: 1 acre = 43,560 ft²', () => {
    expect(acresToFt2(1)).toBe(43560);
    expect(ft2ToAcres(43560)).toBe(1);
  });

  it('#5 circle Ø 10 ft = 78.5398 ft²', () => {
    expect(roomAreaFt2(room({ shape: 'circle', a: 10 }), 'imperial').areaFt2).toBeCloseTo(78.5398163, 6);
  });

  it('#6 trapezoid a 10, b 14, h 8 ft = 96 ft²', () => {
    expect(roomAreaFt2(room({ shape: 'trapezoid', a: 10, b: 14, c: 8 }), 'imperial').areaFt2).toBe(96);
  });

  it('#7 L-shape 20×12 + 8×6 = 288 ft²', () => {
    expect(roomAreaFt2(room({ shape: 'lshape', a: 20, b: 12, c: 8, d: 6 }), 'imperial').areaFt2).toBe(288);
  });

  it('#8 168 ft² + 10% = 184.8 ft² → 9 boxes of 22.69 ft²', () => {
    const r = calculateSquareFootage(input({ rooms: [room({ a: 12, b: 14 })], wastePct: 10, boxCoverage: 22.69 }));
    expect(r.orderFt2).toBeCloseTo(184.8, 9);
    expect(r.boxes).toBe(9);
  });

  it('#9 200 ft² minus a 3×5 ft cut-out = 185 ft²', () => {
    const r = calculateSquareFootage(
      input({ rooms: [room({ id: 'a', a: 20, b: 10 }), room({ id: 'b', a: 3, b: 5, subtract: true })] }),
    );
    expect(r.grossFt2).toBe(200);
    expect(r.deductedFt2).toBe(15);
    expect(r.netFt2).toBe(185);
  });

  it(`#10 12'6" × 10 ft = 125 ft² (feet-and-inches input)`, () => {
    const len = parseFeet(`12'6"`);
    expect(len).toBe(12.5);
    expect(roomAreaFt2(room({ a: len, b: 10 }), 'imperial').areaFt2).toBe(125);
  });
});

describe('shapes', () => {
  it('triangle base 10, height 8 = 40 ft²', () => {
    expect(roomAreaFt2(room({ shape: 'triangle', a: 10, b: 8 }), 'imperial').areaFt2).toBe(40);
  });

  it('known area passes through', () => {
    expect(roomAreaFt2(room({ shape: 'area', a: 350 }), 'imperial').areaFt2).toBe(350);
  });

  it('metric rectangle 4 m × 5 m = 20 m² = 215.278 ft²', () => {
    const { areaFt2 } = roomAreaFt2(room({ a: 4, b: 5 }), 'metric');
    expect(ft2ToM2(areaFt2)).toBeCloseTo(20, 9);
    expect(areaFt2).toBeCloseTo(215.2782, 3);
  });

  it('metric known area 20 m² round-trips', () => {
    expect(m2ToFt2(20)).toBeCloseTo(215.2782, 3);
    expect(ft2ToM2(m2ToFt2(20))).toBeCloseTo(20, 12);
  });

  it('negative or missing inputs produce a text error, not a number', () => {
    expect(roomAreaFt2(room({ a: -1, b: 10 }), 'imperial').error).toMatch(/0 or more/);
    expect(roomAreaFt2(room({ shape: 'lshape', a: 10, b: 10, c: 5 }), 'imperial').error).toMatch(/L/);
    expect(roomAreaFt2(room({ shape: 'trapezoid', a: 10, b: 10, c: NaN }), 'imperial').error).toBeDefined();
  });

  it('zero dimensions are valid and give 0', () => {
    expect(roomAreaFt2(room({ a: 0, b: 10 }), 'imperial')).toEqual({ areaFt2: 0 });
  });
});

describe('totals', () => {
  it('sums different rooms', () => {
    const r = calculateSquareFootage(
      input({
        rooms: [room({ id: 'a', name: 'Kitchen', a: 12, b: 10 }), room({ id: 'b', name: 'Hall', shape: 'area', a: 40 })],
      }),
    );
    expect(r.netFt2).toBe(160);
    expect(r.netYd2).toBeCloseTo(17.7778, 4);
  });

  it('quantity multiplies identical rooms', () => {
    const r = calculateSquareFootage(input({ rooms: [room({ a: 10, b: 11, qty: 3 })] }));
    expect(r.netFt2).toBe(330);
    expect(r.rooms[0].unitAreaFt2).toBe(110);
  });

  it('quantity is clamped to a whole number between 1 and 99', () => {
    expect(roomQty(0)).toBe(1);
    expect(roomQty(2.4)).toBe(2);
    expect(roomQty(500)).toBe(99);
    expect(roomQty(NaN)).toBe(1);
  });

  it('invalid rooms are excluded from totals but kept in the list', () => {
    const r = calculateSquareFootage(input({ rooms: [room({ id: 'a', a: 10, b: 10 }), room({ id: 'b', a: -5, b: 2 })] }));
    expect(r.netFt2).toBe(100);
    expect(r.rooms).toHaveLength(2);
    expect(r.rooms[1].error).toBeDefined();
  });

  it('cut-outs larger than the rooms clamp the total to 0 and warn', () => {
    const r = calculateSquareFootage(
      input({ rooms: [room({ id: 'a', a: 5, b: 5 }), room({ id: 'b', a: 10, b: 10, subtract: true })] }),
    );
    expect(r.netFt2).toBe(0);
    expect(r.warnings).toHaveLength(1);
  });

  it('waste is clamped to 0–50 %', () => {
    const big = calculateSquareFootage(input({ rooms: [room({ a: 10, b: 10 })], wastePct: 90 }));
    expect(big.orderFt2).toBe(150);
    const neg = calculateSquareFootage(input({ rooms: [room({ a: 10, b: 10 })], wastePct: -5 }));
    expect(neg.orderFt2).toBe(100);
  });

  it('blank room names fall back to "Room N"', () => {
    const r = calculateSquareFootage(input({ rooms: [room({ id: 'a', name: '  ', a: 1, b: 1 })] }));
    expect(r.rooms[0].name).toBe('Room 1');
  });
});

describe('boxes and cost', () => {
  it('boxes round up and ignore missing coverage', () => {
    expect(boxesNeeded(100, 20)).toBe(5);
    expect(boxesNeeded(100.01, 20)).toBe(6);
    expect(boxesNeeded(100, 0)).toBe(0);
    expect(boxesNeeded(100, undefined)).toBe(0);
    expect(boxesNeeded(0, 20)).toBe(0);
  });

  it('metric box coverage is converted from m²', () => {
    const r = calculateSquareFootage(input({ units: 'metric', rooms: [room({ a: 4, b: 5 })], boxCoverage: 2 }));
    expect(r.boxes).toBe(10);
  });

  it('cost in the unit the price is quoted in', () => {
    expect(cost(180, 4.5, 'ft2')).toBeCloseTo(810, 9);
    expect(cost(180, 45, 'yd2')).toBeCloseTo(900, 9);
    expect(cost(180, undefined, 'ft2')).toBeUndefined();
    expect(cost(180, -1, 'ft2')).toBeUndefined();
  });

  it('cost uses the area with waste', () => {
    const r = calculateSquareFootage(input({ rooms: [room({ a: 10, b: 10 })], wastePct: 10, price: 2, priceUnit: 'ft2' }));
    expect(r.cost).toBeCloseTo(220, 9);
  });
});

describe('default example', () => {
  it('opens with 14 × 12 ft = 168 ft², 184.8 ft² with 10 % waste', () => {
    const r = calculateSquareFootage(DEFAULT_INPUT);
    expect(r.netFt2).toBe(168);
    expect(r.orderFt2).toBeCloseTo(184.8, 9);
    expect(r.steps.length).toBeGreaterThan(2);
  });
});
