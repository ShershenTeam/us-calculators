import { describe, expect, it } from 'vitest';
import { percentOf, isWhatPercent, ofWhat, percentChange, applyPercent, percentDifference, answer, num, DEFAULT_INPUT, MODES } from './logic';

/** Reference examples: docs/briefs/percentage-calculator.md §3. */

describe('reference examples (brief §3)', () => {
  it('#1 NIST SP 811 §7.10.2: % is the number 0.01, so 1% of 1 = 0.01', () => {
    expect(percentOf(1, 1).value).toBe(0.01);
  });

  it('#2 15% of 80 = 12', () => {
    expect(percentOf(15, 80).value).toBeCloseTo(12, 12);
    expect(percentOf(15, 80).text).toBe('12');
  });

  it('#3 12 is 25% of 48', () => {
    expect(isWhatPercent(12, 48).value).toBe(25);
    expect(isWhatPercent(12, 48).text).toBe('25%');
  });

  it('#4 30 is 20% of 150', () => {
    expect(ofWhat(30, 20).value).toBeCloseTo(150, 12);
  });

  it('#5 50 → 65 is a 30% increase; 65 → 50 is a 23.08% decrease (not 30%)', () => {
    expect(percentChange(50, 65).value).toBeCloseTo(30, 12);
    expect(percentChange(50, 65).text).toBe('+30%');
    expect(percentChange(65, 50).value).toBeCloseTo(-23.076923, 6);
    expect(percentChange(65, 50).sentence).toMatch(/decrease/);
  });

  it('#6 80 decreased by 20% = 64; increased by 20% = 96', () => {
    expect(applyPercent(80, 20, 'down').value).toBeCloseTo(64, 12);
    expect(applyPercent(80, 20, 'up').value).toBeCloseTo(96, 12);
  });

  it('#7 percent difference of 40 and 60 = 40% (difference over the average)', () => {
    expect(percentDifference(40, 60).value).toBeCloseTo(40, 12);
    expect(percentDifference(60, 40).value).toBeCloseTo(40, 12);
  });

  it('#8 +10% then −10% does not return to the start: 100 → 110 → 99', () => {
    const up = applyPercent(100, 10, 'up').value;
    expect(applyPercent(up, 10, 'down').value).toBeCloseTo(99, 12);
  });

  it('#9 a change between negative numbers is measured against |start|: −50 → −25 is +50%', () => {
    expect(percentChange(-50, -25).value).toBeCloseTo(50, 12);
  });

  it('#10 floating-point noise is not shown: 7% of 100 displays "7"', () => {
    expect(0.07 * 100).not.toBe(7);
    expect(percentOf(7, 100).text).toBe('7');
  });
});

describe('errors and formatting', () => {
  it('division by zero gives a text explanation, not NaN or Infinity', () => {
    expect(isWhatPercent(5, 0).error).toMatch(/cannot be 0/);
    expect(ofWhat(5, 0).error).toMatch(/cannot be 0/);
    expect(percentChange(0, 5).error).toMatch(/cannot be 0/);
    expect(percentDifference(5, -5).error).toMatch(/undefined/);
  });

  it('missing numbers ask for input', () => {
    expect(percentOf(NaN, 5).error).toMatch(/both numbers/);
  });

  it('very large and very small values switch to exponent notation', () => {
    expect(num(1e18)).toBe('1e+18');
    expect(num(1.5e-9)).toBe('1.5e-9');
    expect(num(1234.5)).toBe('1,234.5');
  });

  it('every mode answers the default example', () => {
    for (const m of MODES) expect(answer(m, DEFAULT_INPUT).error).toBeUndefined();
  });

  it('steps end on the answer', () => {
    const a = percentOf(15, 80);
    expect(a.steps.at(-1)!.value).toBe(a.text);
  });
});
