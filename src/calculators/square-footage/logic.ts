/**
 * Square footage calculator — pure functions, no UI.
 * Formula, reference examples and sources: docs/briefs/square-footage-calculator.md §3.
 *
 *   rectangle   A = L × W
 *   L-shape     A = L₁ × W₁ + L₂ × W₂
 *   circle      A = π × (D ÷ 2)²
 *   triangle    A = ½ × base × height
 *   trapezoid   A = (a + b) ÷ 2 × h
 *   area        A = the value entered
 *
 *   room total  = A × quantity, negative when the room is a cut-out
 *   net         = Σ adding rooms − Σ cut-outs   (never below 0)
 *   to order    = net × (1 + waste%)
 *   boxes       = ceil(to order ÷ coverage per box)
 */
import type { PriceUnit, RoomInput, RoomResult, SquareFootageInput, SquareFootageResult, Step, UnitSystem } from './types';
import { fmt } from '@/lib/format';
import {
  shapeAreaFt2,
  shapeExpression,
  toSquareFeet,
  ft2ToM2,
  m2ToFt2,
  FT2_PER_YD2,
  FT2_PER_ACRE,
} from '@/lib/area';

/* Shapes, units and exact NIST factors live in src/lib/area.ts (shared with cubic yards). */
export { M_PER_FT, FT_PER_M, M2_PER_FT2, FT2_PER_M2, FT2_PER_YD2, FT2_PER_ACRE, toFeet, toSquareFeet, ft2ToM2, m2ToFt2 } from '@/lib/area';

/** Waste presets by how the material is laid: Mullican Flooring (5 %, diagonal 10–15 %), Daltile (tile ~10 %). Brief §3. */
export const WASTE_PRESETS = [
  { id: 'straight', label: 'Straight', pct: 5, note: 'Planks or tile laid parallel to the walls' },
  { id: 'tile', label: 'Tile', pct: 10, note: 'Tile, vinyl and most patterned layouts' },
  { id: 'diagonal', label: 'Diagonal', pct: 15, note: 'Diagonal, herringbone or a room with many angles' },
] as const;

export type WastePresetId = (typeof WASTE_PRESETS)[number]['id'];

export const MAX_WASTE_PCT = 50;

export const DEFAULT_INPUT: SquareFootageInput = {
  units: 'imperial',
  rooms: [{ id: 'r1', name: 'Living room', shape: 'rectangle', a: 14, b: 12, qty: 1 }],
  wastePct: 10,
  priceUnit: 'ft2',
};

/* ---------- unit helpers ---------- */

export const ft2ToYd2 = (ft2: number): number => ft2 / FT2_PER_YD2;
export const ft2ToAcres = (ft2: number): number => ft2 / FT2_PER_ACRE;
export const acresToFt2 = (acres: number): number => acres * FT2_PER_ACRE;

/* ---------- geometry ---------- */

/** Area of one room in ft², or NaN with a message the field can show. */
export function roomAreaFt2(room: RoomInput, units: UnitSystem): { areaFt2: number; error?: string } {
  return shapeAreaFt2(room, units);
}

/** Quantity clamped to a whole number of rooms, at least 1. */
export function roomQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(99, Math.max(1, Math.round(qty)));
}

export function computeRoom(room: RoomInput, units: UnitSystem, index: number): RoomResult {
  const name = room.name.trim() || `Room ${index + 1}`;
  const subtract = Boolean(room.subtract);
  const { areaFt2: unit, error } = roomAreaFt2(room, units);
  if (error) {
    return { id: room.id, name, shape: room.shape, unitAreaFt2: 0, areaFt2: 0, qty: roomQty(room.qty), subtract, error };
  }
  const qty = roomQty(room.qty);
  const total = unit * qty;
  return { id: room.id, name, shape: room.shape, unitAreaFt2: unit, areaFt2: subtract ? -total : total, qty, subtract };
}

/* ---------- ordering ---------- */

/** Whole boxes, rounded up; 0 when nothing is needed or no coverage was entered. */
export function boxesNeeded(orderFt2: number, coverageFt2: number | undefined): number {
  if (coverageFt2 == null || !(coverageFt2 > 0) || !(orderFt2 > 0)) return 0;
  return Math.ceil(orderFt2 / coverageFt2 - 1e-9);
}

/** The order area expressed in the unit the price is quoted in. */
export function areaInPriceUnit(orderFt2: number, unit: PriceUnit): number {
  switch (unit) {
    case 'yd2':
      return ft2ToYd2(orderFt2);
    case 'm2':
      return ft2ToM2(orderFt2);
    default:
      return orderFt2;
  }
}

export function cost(orderFt2: number, price: number | undefined, unit: PriceUnit): number | undefined {
  if (price == null || !Number.isFinite(price) || price < 0) return undefined;
  return areaInPriceUnit(orderFt2, unit) * price;
}

/** Typical U.S. room sizes, for the reference table under the calculator. */
export const COMMON_ROOM_SIZES = [
  [8, 10],
  [10, 10],
  [10, 12],
  [12, 12],
  [12, 14],
  [12, 16],
  [14, 16],
  [16, 20],
  [20, 24],
] as const;

export function commonRoomSizes() {
  return COMMON_ROOM_SIZES.map(([l, w]) => ({ l, w, ft2: l * w, m2: ft2ToM2(l * w) }));
}

/* ---------- main ---------- */

export function calculateSquareFootage(input: SquareFootageInput): SquareFootageResult {
  const units = input.units;
  const rooms = input.rooms.map((r, i) => computeRoom(r, units, i));
  const valid = rooms.filter((r) => !r.error);

  const gross = valid.filter((r) => !r.subtract).reduce((s, r) => s + r.areaFt2, 0);
  const deducted = valid.filter((r) => r.subtract).reduce((s, r) => s - r.areaFt2, 0);
  const net = Math.max(0, gross - deducted);

  const waste = Number.isFinite(input.wastePct) ? Math.min(MAX_WASTE_PCT, Math.max(0, input.wastePct)) : 0;
  const factor = 1 + waste / 100;
  const orderFt2 = net * factor;

  const coverageFt2 = input.boxCoverage != null ? toSquareFeet(input.boxCoverage, units) : undefined;
  const boxes = boxesNeeded(orderFt2, coverageFt2);
  const total = cost(orderFt2, input.price, input.priceUnit);

  const warnings: string[] = [];
  if (deducted > gross && gross > 0) {
    warnings.push('The cut-outs are larger than the rooms they come out of, so the total is shown as 0.');
  }

  // Steps are written in the unit the user typed in; conversions follow at the end.
  const metric = units === 'metric';
  const n = (ft2: number) => fmt(metric ? ft2ToM2(ft2) : ft2, 2);
  const sq = metric ? 'm²' : 'ft²';

  const steps: Step[] = [];
  for (const r of valid) {
    const src = input.rooms.find((x) => x.id === r.id)!;
    const qtyPart = r.qty > 1 ? ` × ${r.qty}` : '';
    steps.push({
      label: r.subtract ? `− ${r.name}` : r.name,
      expression: `${shapeExpression(src, units, fmt)}${qtyPart}`,
      value: `${r.subtract ? '−' : ''}${n(Math.abs(r.areaFt2))} ${sq}`,
    });
  }
  if (valid.length > 1) {
    steps.push({
      label: 'Total area',
      expression: deducted > 0 ? `${n(gross)} − ${n(deducted)}` : valid.map((r) => n(r.areaFt2)).join(' + '),
      value: `${n(net)} ${sq}`,
    });
  }
  if (waste > 0) {
    steps.push({
      label: `+${fmt(waste, 0)}% waste`,
      expression: `${n(net)} ${sq} × ${fmt(factor, 2)}`,
      value: `${n(orderFt2)} ${sq}`,
    });
  }
  if (metric) {
    steps.push({ label: 'Square feet', expression: `${fmt(ft2ToM2(net), 2)} m² ÷ 0.09290304`, value: `${fmt(net, 2)} ft²` });
  } else {
    steps.push({ label: 'Square metres', expression: `${fmt(net, 2)} ft² × 0.09290304`, value: `${fmt(ft2ToM2(net), 2)} m²` });
  }
  steps.push({ label: 'Square yards', expression: `${fmt(net, 2)} ft² ÷ 9`, value: `${fmt(ft2ToYd2(net), 2)} yd²` });
  if (net >= FT2_PER_ACRE / 100) {
    steps.push({ label: 'Acres', expression: `${fmt(net, 2)} ft² ÷ 43,560`, value: `${fmt(ft2ToAcres(net), 4)} acres` });
  }
  if (boxes > 0 && coverageFt2 != null) {
    steps.push({
      label: 'Boxes',
      expression: `⌈${n(orderFt2)} ${sq} ÷ ${fmt(input.boxCoverage!, 2)} ${sq}⌉`,
      value: `${boxes} boxes`,
    });
  }
  if (total != null) {
    steps.push({
      label: 'Cost',
      expression: `${fmt(areaInPriceUnit(orderFt2, input.priceUnit), 2)} ${priceUnitLabel(input.priceUnit)} × $${fmt(input.price!, 2)}`,
      value: `$${fmt(total, 2, true)}`,
    });
  }

  return {
    rooms,
    grossFt2: gross,
    deductedFt2: deducted,
    netFt2: net,
    netYd2: ft2ToYd2(net),
    netM2: ft2ToM2(net),
    netAcres: ft2ToAcres(net),
    orderFt2,
    orderM2: ft2ToM2(orderFt2),
    boxes,
    cost: total,
    steps,
    warnings,
  };
}

export function priceUnitLabel(unit: PriceUnit): string {
  return unit === 'yd2' ? 'yd²' : unit === 'm2' ? 'm²' : 'ft²';
}
