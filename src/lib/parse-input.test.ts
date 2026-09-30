import { describe, it, expect } from 'vitest';
import { parseNumber, parseFeet } from './parse-input';

describe('parseNumber', () => {
  it('reads thousands separators', () => expect(parseNumber('1,250')).toBe(1250));
  it('reads decimals with leading dot', () => expect(parseNumber('.5')).toBe(0.5));
  it('reads fractions', () => expect(parseNumber('1/2')).toBe(0.5));
  it('reads mixed fractions', () => expect(parseNumber('2 1/2')).toBe(2.5));
  it('returns NaN for empty', () => expect(parseNumber('')).toBeNaN());
  it('returns NaN for garbage', () => expect(parseNumber('abc')).toBeNaN());
  it('keeps negatives', () => expect(parseNumber('-3')).toBe(-3));
});

describe('parseFeet', () => {
  it("3'6\" → 3.5 ft", () => expect(parseFeet(`3'6"`)).toBeCloseTo(3.5, 10));
  it("10' → 10 ft", () => expect(parseFeet(`10'`)).toBe(10));
  it('6 ft 3 in → 6.25', () => expect(parseFeet('6 ft 3 in')).toBeCloseTo(6.25, 10));
  it('18" → 1.5 ft', () => expect(parseFeet('18"')).toBeCloseTo(1.5, 10));
  it('plain number passes through', () => expect(parseFeet('12.5')).toBe(12.5));
});
