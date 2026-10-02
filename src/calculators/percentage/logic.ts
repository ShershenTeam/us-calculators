/**
 * Percentage calculator — pure functions, no UI.
 * Formula, reference examples and sources: docs/briefs/percentage-calculator.md §3.
 * "%" is the number 0.01 (NIST SP 811 §7.10.2), so P % of X = P × 0.01 × X.
 *
 *   of        What is P% of X?          r = P/100 × X
 *   isWhat    X is what % of Y?         r = X / Y × 100
 *   ofWhat    X is P% of what?          r = X / (P/100)
 *   change    % change from A to B      r = (B − A) / |A| × 100
 *   apply     X increased/decreased by P%   r = X × (1 ± P/100)
 *   diff      % difference of A and B   r = |A − B| / ((A + B) / 2) × 100
 */
import { fmt } from '@/lib/format';

export type Mode = 'of' | 'isWhat' | 'ofWhat' | 'change' | 'apply' | 'diff';
export type Direction = 'up' | 'down';

export interface Step {
  label: string;
  expression: string;
  value: string;
}

export interface Answer {
  /** NaN with `error` when the question has no answer (e.g. division by zero). */
  value: number;
  /** The answer as text, with "%" where it is a percentage. */
  text: string;
  /** A sentence that repeats the question with the answer, for Copy and screen readers. */
  sentence: string;
  steps: Step[];
  error?: string;
}

export interface PercentageInput {
  of: { p: number; x: number };
  isWhat: { x: number; y: number };
  ofWhat: { x: number; p: number };
  change: { a: number; b: number };
  apply: { x: number; p: number; dir: Direction };
  diff: { a: number; b: number };
}

export const DEFAULT_INPUT: PercentageInput = {
  of: { p: 15, x: 80 },
  isWhat: { x: 12, y: 48 },
  ofWhat: { x: 30, p: 20 },
  change: { a: 50, b: 65 },
  apply: { x: 80, p: 20, dir: 'down' },
  diff: { a: 40, b: 60 },
};

/** Common percentages shown as a quick table for the first number. */
export const COMMON_PCTS = [5, 10, 15, 18, 20, 25, 30, 50, 75] as const;

/* ---------- formatting ---------- */

/** Up to 6 decimals, trailing zeros trimmed; huge and tiny values stay readable. */
export function num(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e15 || a < 1e-6)) return v.toExponential(6).replace(/\.?0+e/, 'e');
  return fmt(v, 6);
}

export const pct = (v: number): string => `${num(v)}%`;

const bad = (...ns: number[]) => ns.some((n) => !Number.isFinite(n));
const missing: Answer = { value: NaN, text: '—', sentence: '', steps: [], error: 'Enter both numbers.' };

/* ---------- modes ---------- */

export function percentOf(p: number, x: number): Answer {
  if (bad(p, x)) return missing;
  const r = (p / 100) * x;
  return {
    value: r,
    text: num(r),
    sentence: `${pct(p)} of ${num(x)} is ${num(r)}`,
    steps: [
      { label: 'Percent as a decimal', expression: `${num(p)} ÷ 100`, value: num(p / 100) },
      { label: 'Multiply', expression: `${num(p / 100)} × ${num(x)}`, value: num(r) },
    ],
  };
}

export function isWhatPercent(x: number, y: number): Answer {
  if (bad(x, y)) return missing;
  if (y === 0) return { value: NaN, text: '—', sentence: '', steps: [], error: 'The second number cannot be 0 — nothing is a percentage of zero.' };
  const r = (x / y) * 100;
  return {
    value: r,
    text: pct(r),
    sentence: `${num(x)} is ${pct(r)} of ${num(y)}`,
    steps: [
      { label: 'Divide', expression: `${num(x)} ÷ ${num(y)}`, value: num(x / y) },
      { label: 'As a percent', expression: `${num(x / y)} × 100`, value: pct(r) },
    ],
  };
}

export function ofWhat(x: number, p: number): Answer {
  if (bad(x, p)) return missing;
  if (p === 0) return { value: NaN, text: '—', sentence: '', steps: [], error: 'The percent cannot be 0 — 0% of any number is 0.' };
  const r = x / (p / 100);
  return {
    value: r,
    text: num(r),
    sentence: `${num(x)} is ${pct(p)} of ${num(r)}`,
    steps: [
      { label: 'Percent as a decimal', expression: `${num(p)} ÷ 100`, value: num(p / 100) },
      { label: 'Divide', expression: `${num(x)} ÷ ${num(p / 100)}`, value: num(r) },
    ],
  };
}

export function percentChange(a: number, b: number): Answer {
  if (bad(a, b)) return missing;
  if (a === 0) return { value: NaN, text: '—', sentence: '', steps: [], error: 'The starting value cannot be 0 — a change from zero has no percentage.' };
  const r = ((b - a) / Math.abs(a)) * 100;
  const word = r > 0 ? 'increase' : r < 0 ? 'decrease' : 'change';
  return {
    value: r,
    text: `${r > 0 ? '+' : ''}${pct(r)}`,
    sentence: `From ${num(a)} to ${num(b)} is a ${pct(Math.abs(r))} ${word}`,
    steps: [
      { label: 'Difference', expression: `${num(b)} − ${num(a)}`, value: num(b - a) },
      { label: 'Divide by the start', expression: `${num(b - a)} ÷ ${num(Math.abs(a))}`, value: num((b - a) / Math.abs(a)) },
      { label: 'As a percent', expression: `${num((b - a) / Math.abs(a))} × 100`, value: pct(r) },
    ],
  };
}

export function applyPercent(x: number, p: number, dir: Direction): Answer {
  if (bad(x, p)) return missing;
  const f = dir === 'up' ? 1 + p / 100 : 1 - p / 100;
  const r = x * f;
  const verb = dir === 'up' ? 'increased' : 'decreased';
  return {
    value: r,
    text: num(r),
    sentence: `${num(x)} ${verb} by ${pct(p)} is ${num(r)}`,
    steps: [
      { label: 'Factor', expression: `1 ${dir === 'up' ? '+' : '−'} ${num(p)} ÷ 100`, value: num(f) },
      { label: 'Multiply', expression: `${num(x)} × ${num(f)}`, value: num(r) },
      { label: dir === 'up' ? 'Amount added' : 'Amount taken off', expression: `${num(x)} × ${num(p)} ÷ 100`, value: num(Math.abs(r - x)) },
    ],
  };
}

export function percentDifference(a: number, b: number): Answer {
  if (bad(a, b)) return missing;
  const mean = (a + b) / 2;
  if (mean === 0) return { value: NaN, text: '—', sentence: '', steps: [], error: 'The two numbers average to 0, so the percent difference is undefined.' };
  const r = (Math.abs(a - b) / Math.abs(mean)) * 100;
  return {
    value: r,
    text: pct(r),
    sentence: `${num(a)} and ${num(b)} differ by ${pct(r)}`,
    steps: [
      { label: 'Difference', expression: `|${num(a)} − ${num(b)}|`, value: num(Math.abs(a - b)) },
      { label: 'Average', expression: `(${num(a)} + ${num(b)}) ÷ 2`, value: num(mean) },
      { label: 'As a percent of the average', expression: `${num(Math.abs(a - b))} ÷ ${num(Math.abs(mean))} × 100`, value: pct(r) },
    ],
  };
}

export function answer(mode: Mode, input: PercentageInput): Answer {
  switch (mode) {
    case 'of':
      return percentOf(input.of.p, input.of.x);
    case 'isWhat':
      return isWhatPercent(input.isWhat.x, input.isWhat.y);
    case 'ofWhat':
      return ofWhat(input.ofWhat.x, input.ofWhat.p);
    case 'change':
      return percentChange(input.change.a, input.change.b);
    case 'apply':
      return applyPercent(input.apply.x, input.apply.p, input.apply.dir);
    case 'diff':
      return percentDifference(input.diff.a, input.diff.b);
  }
}

export const MODES: readonly Mode[] = ['of', 'isWhat', 'ofWhat', 'change', 'apply', 'diff'];
