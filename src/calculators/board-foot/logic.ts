/**
 * Board foot calculator — pure functions, no UI.
 * Formula, reference examples and sources: docs/briefs/board-foot-calculator.md §3.
 *
 *   board feet (one piece) = nominal thickness (in) × nominal width (in) × length (ft) ÷ 12
 *     — American Softwood Lumber Standard PS 20-25 §2.2: "multiplying the nominal thickness in inches …
 *       by the nominal width in feet by the length in feet"; a board foot is 1 ft × 1 ft × 1 in (USDA FIA).
 *   total                  = Σ pieces × board feet per piece
 *   with waste             = total × (1 + waste %)
 *   cost                   = board feet × price per board foot, or pieces × price per piece
 */
import { fmt } from '@/lib/format';

export type PriceBasis = 'bf' | 'piece' | 'lf';

export interface LumberRow {
  id: string;
  /** Preset id such as '2x4', or 'custom'. */
  size: string;
  /** Nominal thickness and width in inches (custom rows; presets fill these). */
  t: number;
  w: number;
  /** Length of one piece in feet. */
  lengthFt: number;
  pieces: number;
  /** Price for this row, in the unit of `basis`. */
  price?: number;
  basis: PriceBasis;
}

export interface BoardFootInput {
  rows: LumberRow[];
  wastePct: number;
}

export interface RowResult {
  id: string;
  label: string;
  bfPerPiece: number;
  bf: number;
  linearFt: number;
  cost?: number;
  error?: string;
}

export interface Step {
  label: string;
  expression: string;
  value: string;
}

export interface BoardFootResult {
  rows: RowResult[];
  totalBf: number;
  orderBf: number;
  linearFt: number;
  pieces: number;
  cost?: number;
  /** Cubic feet of nominal volume (board feet ÷ 12). */
  cubicFt: number;
  steps: Step[];
  warnings: string[];
}

/**
 * Common nominal sizes with their minimum dressed dry sizes from PS 20-25 (Table 1 for boards:
 * 1 in → ¾ in; widths 2 → 1½, 4 → 3½, 6 → 5½, 8 → 7¼, 10 → 9¼, 12 → 11¼; dimension 2 in → 1½ in, 4 in → 3½ in).
 * Hardwood is sold in quarters of an inch: 4/4 = 1 in, 5/4 = 1¼ in, 8/4 = 2 in.
 */
export const SIZES: readonly { id: string; label: string; t: number; w: number; dressed?: string }[] = [
  { id: '1x4', label: '1×4', t: 1, w: 4, dressed: '¾ × 3½ in' },
  { id: '1x6', label: '1×6', t: 1, w: 6, dressed: '¾ × 5½ in' },
  { id: '1x8', label: '1×8', t: 1, w: 8, dressed: '¾ × 7¼ in' },
  { id: '1x12', label: '1×12', t: 1, w: 12, dressed: '¾ × 11¼ in' },
  { id: '2x4', label: '2×4', t: 2, w: 4, dressed: '1½ × 3½ in' },
  { id: '2x6', label: '2×6', t: 2, w: 6, dressed: '1½ × 5½ in' },
  { id: '2x8', label: '2×8', t: 2, w: 8, dressed: '1½ × 7¼ in' },
  { id: '2x10', label: '2×10', t: 2, w: 10, dressed: '1½ × 9¼ in' },
  { id: '2x12', label: '2×12', t: 2, w: 12, dressed: '1½ × 11¼ in' },
  { id: '4x4', label: '4×4', t: 4, w: 4, dressed: '3½ × 3½ in' },
];

/** Hardwood thickness in quarters of an inch. */
export const QUARTERS = [
  { id: '4/4', t: 1 },
  { id: '5/4', t: 1.25 },
  { id: '6/4', t: 1.5 },
  { id: '8/4', t: 2 },
] as const;

export const LENGTHS_FT = [8, 10, 12, 16] as const;
export const MAX_WASTE_PCT = 50;
export const MAX_PIECES = 9999;

export const DEFAULT_INPUT: BoardFootInput = {
  rows: [
    { id: 'b1', size: '2x4', t: 2, w: 4, lengthFt: 8, pieces: 10, basis: 'piece' },
    { id: 'b2', size: '2x6', t: 2, w: 6, lengthFt: 12, pieces: 4, basis: 'piece' },
  ],
  wastePct: 0,
};

export function sizeById(id: string) {
  return SIZES.find((s) => s.id === id);
}

/** Board feet of one piece: T (in) × W (in) × L (ft) ÷ 12. */
export function boardFeet(tIn: number, wIn: number, lengthFt: number): number {
  return (tIn * wIn * lengthFt) / 12;
}

function isBad(n: number | undefined): boolean {
  return n == null || !Number.isFinite(n) || n < 0;
}

export function wholePieces(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_PIECES, Math.max(0, Math.round(n)));
}

export function rowLabel(r: LumberRow): string {
  const preset = sizeById(r.size);
  const dims = preset ? preset.label : `${fmt(r.t, 3)}×${fmt(r.w, 3)}`;
  return `${dims} × ${fmt(r.lengthFt, 2)} ft`;
}

export function computeRow(r: LumberRow): RowResult {
  const preset = sizeById(r.size);
  const t = preset ? preset.t : r.t;
  const w = preset ? preset.w : r.w;
  const label = rowLabel(r);
  if (isBad(t) || isBad(w) || isBad(r.lengthFt)) return { id: r.id, label, bfPerPiece: 0, bf: 0, linearFt: 0, error: 'Enter thickness, width and length of 0 or more.' };
  const pieces = wholePieces(r.pieces);
  const bfPerPiece = boardFeet(t, w, r.lengthFt);
  const bf = bfPerPiece * pieces;
  const linearFt = r.lengthFt * pieces;
  let cost: number | undefined;
  if (r.price != null && Number.isFinite(r.price) && r.price >= 0) {
    cost = r.basis === 'piece' ? r.price * pieces : r.basis === 'lf' ? r.price * linearFt : r.price * bf;
  }
  return { id: r.id, label, bfPerPiece, bf, linearFt, cost };
}

export function calculateBoardFeet(input: BoardFootInput): BoardFootResult {
  const rows = input.rows.map(computeRow);
  const valid = rows.filter((r) => !r.error);
  const totalBf = valid.reduce((s, r) => s + r.bf, 0);
  const waste = Number.isFinite(input.wastePct) ? Math.min(MAX_WASTE_PCT, Math.max(0, input.wastePct)) : 0;
  const orderBf = totalBf * (1 + waste / 100);
  const linearFt = valid.reduce((s, r) => s + r.linearFt, 0);
  const pieces = input.rows.reduce((s, r, i) => s + (rows[i].error ? 0 : wholePieces(r.pieces)), 0);
  const priced = valid.filter((r) => r.cost != null);
  const cost = priced.length ? priced.reduce((s, r) => s + (r.cost ?? 0), 0) * (1 + waste / 100) : undefined;

  const warnings: string[] = [];
  if (input.rows.some((r) => !sizeById(r.size) && Number.isFinite(r.t) && Number.isFinite(r.w) && r.t > r.w)) {
    warnings.push('Thickness is larger than width on a custom row — the two may be swapped (the result is the same).');
  }
  if (input.rows.some((r) => Number.isFinite(r.lengthFt) && r.lengthFt > 40)) {
    warnings.push('A piece longer than 40 ft is unusual — length is in feet, not inches.');
  }

  const steps: Step[] = [];
  for (const [i, r] of valid.entries()) {
    const src = input.rows.find((x) => x.id === r.id)!;
    const preset = sizeById(src.size);
    const t = preset ? preset.t : src.t;
    const w = preset ? preset.w : src.w;
    const n = wholePieces(src.pieces);
    steps.push({
      label: `${i + 1}. ${preset ? preset.label : 'Custom'}`,
      expression: `${fmt(t, 3)} in × ${fmt(w, 3)} in × ${fmt(src.lengthFt, 2)} ft ÷ 12${n !== 1 ? ` × ${n}` : ''}`,
      value: `${fmt(r.bf, 2)} bd ft`,
    });
  }
  if (valid.length > 1) steps.push({ label: 'Total', expression: valid.map((r) => fmt(r.bf, 2)).join(' + '), value: `${fmt(totalBf, 2)} bd ft` });
  if (waste > 0) steps.push({ label: `+${fmt(waste, 0)}% waste`, expression: `${fmt(totalBf, 2)} × ${fmt(1 + waste / 100, 2)}`, value: `${fmt(orderBf, 2)} bd ft` });
  if (cost != null) steps.push({ label: 'Cost', expression: priced.map((r) => `$${fmt(r.cost!, 2)}`).join(' + ') + (waste > 0 ? ` × ${fmt(1 + waste / 100, 2)}` : ''), value: `$${fmt(cost, 2, true)}` });

  return { rows, totalBf, orderBf, linearFt, pieces, cost, cubicFt: totalBf / 12, steps, warnings };
}
