/**
 * Calculator state ↔ URL query string.
 * Pages keep a clean canonical; state lives only in `?…` so links can be shared
 * and bookmarked (docs/03-architecture.md §5). Decoders must tolerate garbage.
 */

export type StateCodec<T> = {
  encode(state: T): URLSearchParams;
  decode(params: URLSearchParams, defaults: T): T;
};

export function readParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

/** Replace the query string without adding history entries or scrolling. */
export function writeParams(params: URLSearchParams): void {
  if (typeof window === 'undefined') return;
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

export function shareUrl(params: URLSearchParams): string {
  if (typeof window === 'undefined') return '';
  const qs = params.toString();
  return `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`;
}

export function num(params: URLSearchParams, key: string, fallback: number): number {
  const v = params.get(key);
  if (v == null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function oneOf<T extends string>(params: URLSearchParams, key: string, allowed: readonly T[], fallback: T): T {
  const v = params.get(key);
  return v != null && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

/** Compact number for URLs: drops trailing zeros, max 6 decimals. */
export function compact(n: number): string {
  if (!Number.isFinite(n)) return '';
  return String(Number(n.toFixed(6)));
}
