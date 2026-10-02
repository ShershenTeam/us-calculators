import { describe, expect, it } from 'vitest';
import { boardFeet, calculateBoardFeet, computeRow, wholePieces, sizeById, DEFAULT_INPUT, QUARTERS } from './logic';
import type { BoardFootInput, LumberRow } from './logic';

/** Reference examples: docs/briefs/board-foot-calculator.md §3. */

const row = (patch: Partial<LumberRow>): LumberRow => ({ id: 'x', size: 'custom', t: 1, w: 12, lengthFt: 1, pieces: 1, basis: 'bf', ...patch });
const input = (patch: Partial<BoardFootInput>): BoardFootInput => ({ ...DEFAULT_INPUT, wastePct: 0, ...patch });

describe('reference examples (brief §3)', () => {
  it('#1 USDA FIA: one board foot is 1 ft wide, 1 ft long and 1 in thick', () => {
    expect(boardFeet(1, 12, 1)).toBe(1);
  });

  it('#2 a board foot is 144 cubic inches (1 × 12 × 12 in)', () => {
    expect(1 * 12 * 12).toBe(144);
    expect(boardFeet(1, 12, 12 / 12)).toBe(1);
  });

  it('#3 PS 20-25 §2.2 uses nominal sizes: a 2×4 × 8 ft is 5.33 bd ft (not its dressed 1½ × 3½)', () => {
    expect(boardFeet(2, 4, 8)).toBeCloseTo(16 / 3, 12);
    expect(sizeById('2x4')!.dressed).toBe('1½ × 3½ in');
  });

  it('#4 omnicalculator formula gives the same: length (ft) × width (in) × thickness (in) ÷ 12', () => {
    expect(boardFeet(2, 6, 12)).toBe((12 * 6 * 2) / 12);
  });

  it('#5 default list: ten 2×4 × 8 ft + four 2×6 × 12 ft = 101.33 bd ft, 128 linear ft', () => {
    const r = calculateBoardFeet(DEFAULT_INPUT);
    expect(r.totalBf).toBeCloseTo(53.3333 + 48, 4);
    expect(r.linearFt).toBe(128);
    expect(r.pieces).toBe(14);
  });

  it('#6 hardwood 5/4 × 6 in × 10 ft = 6.25 bd ft', () => {
    const t = QUARTERS.find((q) => q.id === '5/4')!.t;
    expect(boardFeet(t, 6, 10)).toBe(6.25);
  });

  it('#7 a 4×4 × 8 ft post = 10.67 bd ft', () => {
    expect(computeRow(row({ size: '4x4', lengthFt: 8 })).bf).toBeCloseTo(32 / 3, 12);
  });

  it('#8 price per board foot, per piece and per linear foot', () => {
    expect(computeRow(row({ size: '1x6', lengthFt: 8, pieces: 5, price: 3, basis: 'bf' })).cost).toBeCloseTo(4 * 5 * 3, 12);
    expect(computeRow(row({ size: '2x4', lengthFt: 8, pieces: 10, price: 4.25, basis: 'piece' })).cost).toBeCloseTo(42.5, 12);
    expect(computeRow(row({ size: '2x6', lengthFt: 12, pieces: 2, price: 1.1, basis: 'lf' })).cost).toBeCloseTo(26.4, 12);
  });

  it('#9 10 % waste on 101.33 bd ft = 111.47 bd ft', () => {
    const r = calculateBoardFeet({ ...DEFAULT_INPUT, wastePct: 10 });
    expect(r.orderBf).toBeCloseTo(111.4667, 4);
  });

  it('#10 nominal cubic feet = board feet ÷ 12', () => {
    expect(calculateBoardFeet(input({ rows: [row({ t: 1, w: 12, lengthFt: 12 })] })).cubicFt).toBe(1);
  });
});

describe('edge cases', () => {
  it('pieces are whole numbers from 0 to 9,999', () => {
    expect(wholePieces(2.6)).toBe(3);
    expect(wholePieces(-3)).toBe(0);
    expect(wholePieces(NaN)).toBe(1);
  });

  it('invalid custom rows give a text error and are left out', () => {
    const r = calculateBoardFeet(input({ rows: [row({ id: 'a', t: 1, w: 12, lengthFt: 1 }), row({ id: 'b', t: -1 })] }));
    expect(r.totalBf).toBe(1);
    expect(r.rows[1].error).toBeDefined();
  });

  it('warns about a length typed in inches and swapped custom dimensions', () => {
    expect(calculateBoardFeet(input({ rows: [row({ lengthFt: 96 })] })).warnings.some((w) => /40 ft/.test(w))).toBe(true);
    expect(calculateBoardFeet(input({ rows: [row({ t: 6, w: 2 })] })).warnings.some((w) => /swapped/.test(w))).toBe(true);
  });

  it('cost is the sum of priced rows, with waste applied', () => {
    const r = calculateBoardFeet({ rows: [row({ size: '2x4', lengthFt: 8, pieces: 10, price: 4, basis: 'piece' })], wastePct: 10 });
    expect(r.cost).toBeCloseTo(44, 12);
  });
});
