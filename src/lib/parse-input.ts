/**
 * Forgiving parsing for numeric fields (docs/06-mobile.md §2):
 *   "1,250" → 1250 · "3'6\"" → 3.5 (feet) · "2 1/2" → 2.5 · "  .5" → 0.5 · "" → NaN
 */

const FEET_INCHES_RE = /^\s*(-?\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*(\d+(?:\.\d+)?)?\s*(?:"|in|inches)?\s*$/i;
const INCHES_ONLY_RE = /^\s*(-?\d+(?:\.\d+)?)\s*(?:"|in|inches)\s*$/i;
const MIXED_FRACTION_RE = /^\s*(-?\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/;
const FRACTION_RE = /^\s*(-?\d+)\s*\/\s*(\d+)\s*$/;

/** Parse a plain number, tolerating thousands separators and stray spaces. */
export function parseNumber(raw: string | number | null | undefined): number {
  if (typeof raw === 'number') return raw;
  if (raw == null) return NaN;
  const s = raw.trim();
  if (s === '') return NaN;

  let m = MIXED_FRACTION_RE.exec(s);
  if (m) return Number(m[1]) + Math.sign(Number(m[1]) || 1) * (Number(m[2]) / Number(m[3]));
  m = FRACTION_RE.exec(s);
  if (m && Number(m[2]) !== 0) return Number(m[1]) / Number(m[2]);

  const cleaned = s.replace(/,/g, '').replace(/\s+/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Parse a length that may be written as feet + inches. Returns feet.
 * Plain numbers are returned as-is (assumed already in the field's unit).
 */
export function parseFeet(raw: string | number | null | undefined): number {
  if (typeof raw !== 'string') return parseNumber(raw);
  const s = raw.trim();
  let m = FEET_INCHES_RE.exec(s);
  if (m) {
    const feet = Number(m[1]);
    const inches = m[2] ? Number(m[2]) : 0;
    return feet + (Math.sign(feet) || 1) * (inches / 12);
  }
  m = INCHES_ONLY_RE.exec(s);
  if (m) return Number(m[1]) / 12;
  return parseNumber(s);
}

/** Clamp helper used by inputs with a declared range. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
