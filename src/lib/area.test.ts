import { describe, expect, it } from 'vitest';
import { shapeAreaFt2, withShape, depthToFeet, convertDepth, SHAPE_CODES, CODE_SHAPES } from './area';

describe('shared plane shapes', () => {
  it('ring = outer circle minus inner circle: Ø 6 ft around a Ø 1 ft trunk = 27.49 ft²', () => {
    expect(shapeAreaFt2({ shape: 'ring', a: 6, b: 1 }, 'imperial').areaFt2).toBeCloseTo(Math.PI * (9 - 0.25), 9);
  });

  it('ring rejects an inner diameter larger than the outer one', () => {
    expect(shapeAreaFt2({ shape: 'ring', a: 2, b: 3 }, 'imperial').error).toMatch(/smaller/);
  });

  it('a ring with no hole equals the circle', () => {
    expect(shapeAreaFt2({ shape: 'ring', a: 4, b: 0 }, 'imperial').areaFt2).toBeCloseTo(shapeAreaFt2({ shape: 'circle', a: 4 }, 'imperial').areaFt2, 12);
  });

  it('switching to ring proposes a hole a quarter of the diameter at most', () => {
    expect(withShape({ shape: 'circle', a: 8 }, 'ring')).toMatchObject({ shape: 'ring', a: 8, b: 2 });
  });

  it('every shape has a unique URL code that round-trips', () => {
    const codes = Object.values(SHAPE_CODES);
    expect(new Set(codes).size).toBe(codes.length);
    for (const [shape, code] of Object.entries(SHAPE_CODES)) expect(CODE_SHAPES[code]).toBe(shape);
  });

  it('depth units: 3 in = 0.25 ft, 1 m = 3.2808 ft, 7.62 cm = 3 in', () => {
    expect(depthToFeet(3, 'in')).toBe(0.25);
    expect(depthToFeet(1, 'm')).toBeCloseTo(3.280839895, 9);
    expect(convertDepth(7.62, 'cm', 'in')).toBeCloseTo(3, 12);
  });
});
