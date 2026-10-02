export type { AreaShape as Shape, UnitSystem } from '@/lib/area';
import type { AreaShape as Shape, UnitSystem } from '@/lib/area';
export type PriceUnit = 'ft2' | 'yd2' | 'm2';

export interface RoomInput {
  id: string;
  /** Shown in the room schedule, the steps and the CSV. Blank falls back to "Room N". */
  name: string;
  shape: Shape;
  /** rectangle: length · lshape: wing 1 length · circle: diameter · triangle: base · trapezoid: side a · area: the area itself */
  a: number;
  /** rectangle: width · lshape: wing 1 width · triangle: height · trapezoid: side b */
  b?: number;
  /** lshape: wing 2 length · trapezoid: height */
  c?: number;
  /** lshape: wing 2 width */
  d?: number;
  /** How many identical rooms of these dimensions. */
  qty: number;
  /** Cut-out (kitchen island, stairwell, hearth): its area is subtracted from the total. */
  subtract?: boolean;
}

export interface SquareFootageInput {
  units: UnitSystem;
  rooms: RoomInput[];
  /** 0–50; extra material for cuts and breakage. */
  wastePct: number;
  /** Area covered by one box/pack, in ft² (imperial) or m² (metric). 0 or undefined → no box count. */
  boxCoverage?: number;
  price?: number;
  priceUnit: PriceUnit;
}

export interface RoomResult {
  id: string;
  name: string;
  shape: Shape;
  /** Area of one room in ft², always positive. */
  unitAreaFt2: number;
  /** unitAreaFt2 × qty, negative for cut-outs. */
  areaFt2: number;
  qty: number;
  subtract: boolean;
  /** Text error when inputs are invalid; the room is then excluded from totals. */
  error?: string;
}

export interface Step {
  label: string;
  expression: string;
  value: string;
}

export interface SquareFootageResult {
  rooms: RoomResult[];
  /** Sum of the rooms that add area. */
  grossFt2: number;
  /** Sum of the rooms marked as cut-outs, as a positive number. */
  deductedFt2: number;
  /** grossFt2 − deductedFt2, never below 0. */
  netFt2: number;
  netYd2: number;
  netM2: number;
  netAcres: number;
  /** netFt2 × (1 + waste%). */
  orderFt2: number;
  orderM2: number;
  /** Whole boxes, rounded up; 0 when no coverage was entered. */
  boxes: number;
  cost?: number;
  steps: Step[];
  warnings: string[];
}
