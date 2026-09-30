/** Number formatting for results: US locale, thousands separators, no scientific notation. */

const cache = new Map<string, Intl.NumberFormat>();

function formatter(minFrac: number, maxFrac: number): Intl.NumberFormat {
  const key = `${minFrac}:${maxFrac}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { minimumFractionDigits: minFrac, maximumFractionDigits: maxFrac });
    cache.set(key, f);
  }
  return f;
}

/** `fmt(1234.5678, 2)` → "1,234.57"; trailing zeros trimmed unless `fixed`. */
export function fmt(value: number, decimals = 2, fixed = false): string {
  if (!Number.isFinite(value)) return '—';
  const v = Math.abs(value) < 1e-12 ? 0 : value;
  return formatter(fixed ? decimals : 0, decimals).format(v);
}

export function fmtInt(value: number): string {
  return fmt(Math.round(value), 0);
}

export function fmtMoney(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function fmtPct(value: number, decimals = 0): string {
  return `${fmt(value, decimals)}%`;
}

/** Round half away from zero to `decimals` places (avoids 1.005 → 1.00 float issues). */
export function round(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON * Math.sign(value)) * f) / f;
}
