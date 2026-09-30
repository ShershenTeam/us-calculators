/**
 * Bulk densities used for ordering, in lb/ft³ (loose, as delivered).
 * Sources: DOT specification for #57 stone (ASTM C29 / AASHTO T19, 81 lb/ft³ dry loose,
 * 92 lb/ft³ rodded), supplier ordering tables (1.35–1.7 tons per cubic yard), and the
 * calculatorsoup/inchcalculator density tables cross-checked on 2026-09-30.
 * tons/yd³ = lb/ft³ × 27 ÷ 2000. Review yearly (January).
 */
export interface GravelType {
  id: string;
  label: string;
  densityLbFt3: number;
  note: string;
}

export const GRAVEL_TYPES: readonly GravelType[] = [
  { id: 'crushed-stone', label: 'Crushed stone (#57)', densityLbFt3: 105, note: 'Most common driveway and drainage stone, ¾–1 in. ≈ 1.42 tons/yd³.' },
  { id: 'pea-gravel', label: 'Pea gravel', densityLbFt3: 100, note: 'Rounded ⅜ in stones for paths, patios and play areas. ≈ 1.35 tons/yd³.' },
  { id: 'river-rock', label: 'River rock', densityLbFt3: 105, note: 'Rounded 1–3 in decorative stone. ≈ 1.42 tons/yd³.' },
  { id: 'crusher-run', label: 'Crusher run / #411', densityLbFt3: 111, note: 'Stone with fines; compacts into a firm base. ≈ 1.50 tons/yd³.' },
  { id: 'dense-graded', label: 'Dense graded base (DGA)', densityLbFt3: 125, note: 'Road base under pavers and asphalt. ≈ 1.69 tons/yd³.' },
  { id: 'bank-run', label: 'Bank run gravel', densityLbFt3: 120, note: 'Unprocessed pit gravel with sand. ≈ 1.62 tons/yd³.' },
  { id: 'decomposed-granite', label: 'Decomposed granite', densityLbFt3: 103, note: 'Fine, compactable path material. ≈ 1.39 tons/yd³.' },
  { id: 'marble-chips', label: 'Marble chips', densityLbFt3: 95, note: 'White decorative chips. ≈ 1.28 tons/yd³.' },
  { id: 'lava-rock', label: 'Lava rock', densityLbFt3: 52, note: 'Very light volcanic rock. ≈ 0.70 tons/yd³.' },
  { id: 'riprap', label: 'Riprap', densityLbFt3: 100, note: 'Large stone for erosion control, 4–12 in. ≈ 1.35 tons/yd³ (voids).' },
];

export const CUSTOM_TYPE_ID = 'custom';
export const DEFAULT_TYPE_ID = 'crushed-stone';

export function gravelTypeById(id: string): GravelType | undefined {
  return GRAVEL_TYPES.find((t) => t.id === id);
}
