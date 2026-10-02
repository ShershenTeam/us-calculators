import { useEffect, useMemo, useState } from 'preact/hooks';
import { NumberInput, Segmented, ResultCard, ResultTable, StickyResult, CopyButton, ShareButton, PrintButton, CsvButton } from '@/components/ui';
import { fmt, fmtMoney } from '@/lib/format';
import { readParams, writeParams, shareUrl, compact } from '@/lib/url-state';
import { calculateBoardFeet, sizeById, SIZES, QUARTERS, DEFAULT_INPUT, MAX_WASTE_PCT, MAX_PIECES } from './logic';
import type { BoardFootInput, LumberRow, PriceBasis } from './logic';

/**
 * Board foot calculator island. Server-rendered with the default lumber list, hydrated on load.
 * A lumber list — nominal sizes 1×4…4×4 with their dressed sizes, hardwood in quarters, or custom —
 * pieces × length · price per piece, board foot or linear foot · waste · totals in board feet,
 * linear feet and pieces · sticky result · Copy/Share/Print/CSV.
 * Brief: docs/briefs/board-foot-calculator.md
 */

let seq = 1;
const newId = () => `b${Date.now().toString(36)}${seq++}`;

const BASES: { value: PriceBasis; label: string }[] = [
  { value: 'piece', label: 'piece' },
  { value: 'bf', label: 'bd ft' },
  { value: 'lf', label: 'lin ft' },
];
const BASIS_CODES: PriceBasis[] = ['piece', 'bf', 'lf'];

/* ---------- URL state ---------- */

function encode(input: BoardFootInput): URLSearchParams {
  const p = new URLSearchParams();
  p.set(
    'l',
    input.rows
      .map((r) =>
        [
          r.size,
          r.size === 'custom' ? compact(r.t) : '',
          r.size === 'custom' ? compact(r.w) : '',
          compact(r.lengthFt),
          String(r.pieces),
          r.price != null && Number.isFinite(r.price) ? compact(r.price) : '',
          r.basis,
        ].join(':'),
      )
      .join(';'),
  );
  if (input.wastePct > 0) p.set('w', compact(input.wastePct));
  return p;
}

function decode(p: URLSearchParams, defaults: BoardFootInput): BoardFootInput {
  if (!p.has('l')) return defaults;
  const n = (v: string | undefined, fb: number | undefined) => {
    if (v == null || v === '') return fb;
    const x = Number(v);
    return Number.isFinite(x) ? x : fb;
  };
  const rows: LumberRow[] = (p.get('l') ?? '')
    .split(';')
    .filter(Boolean)
    .slice(0, 50)
    .map((chunk) => {
      const [size, t, w, len, pieces, price, basis] = chunk.split(':');
      const preset = sizeById(size ?? '');
      return {
        id: newId(),
        size: preset ? preset.id : 'custom',
        t: preset ? preset.t : n(t, 1)!,
        w: preset ? preset.w : n(w, 6)!,
        lengthFt: n(len, 8)!,
        pieces: n(pieces, 1)!,
        price: n(price, undefined),
        basis: BASIS_CODES.includes(basis as PriceBasis) ? (basis as PriceBasis) : 'piece',
      };
    });
  const w = Number(p.get('w'));
  return { rows: rows.length ? rows : defaults.rows, wastePct: Number.isFinite(w) ? Math.min(MAX_WASTE_PCT, Math.max(0, w)) : 0 };
}

/* ---------- component ---------- */

export default function BoardFootCalculator() {
  const [input, setInput] = useState<BoardFootInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInput(decode(readParams(), DEFAULT_INPUT));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeParams(encode(input));
  }, [input, hydrated]);

  const result = useMemo(() => calculateBoardFeet(input), [input]);

  const update = (patch: Partial<BoardFootInput>) => setInput((s) => ({ ...s, ...patch }));
  const updateRow = (id: string, patch: Partial<LumberRow>) => setInput((s) => ({ ...s, rows: s.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const setSize = (id: string, size: string) =>
    setInput((s) => ({
      ...s,
      rows: s.rows.map((r) => {
        if (r.id !== id) return r;
        const preset = sizeById(size);
        if (preset) return { ...r, size, t: preset.t, w: preset.w };
        const q = QUARTERS.find((x) => x.id === size);
        if (q) return { ...r, size: 'custom', t: q.t, w: r.w || 6 };
        return { ...r, size: 'custom' };
      }),
    }));
  const addRow = () =>
    setInput((s) => {
      const last = s.rows.at(-1);
      return { ...s, rows: [...s.rows, { id: newId(), size: last?.size ?? '2x4', t: last?.t ?? 2, w: last?.w ?? 4, lengthFt: last?.lengthFt ?? 8, pieces: 1, basis: last?.basis ?? 'piece', price: undefined }] };
    });
  const removeRow = (id: string) => setInput((s) => ({ ...s, rows: s.rows.length > 1 ? s.rows.filter((r) => r.id !== id) : s.rows }));

  const primary = `${fmt(result.orderBf, 2, true)} bd ft`;

  const summary = [
    `Lumber: ${fmt(result.totalBf, 2)} board feet${input.wastePct > 0 ? ` (${fmt(result.orderBf, 2)} with ${fmt(input.wastePct, 0)}% waste)` : ''}, ${result.pieces} pieces, ${fmt(result.linearFt, 1)} linear ft`,
    ...result.rows.filter((r) => !r.error).map((r, i) => `  ${input.rows[i] ? `${input.rows[i].pieces} × ` : ''}${r.label}: ${fmt(r.bf, 2)} bd ft${r.cost != null ? `, ${fmtMoney(r.cost)}` : ''}`),
    result.cost != null ? `Cost: ${fmtMoney(result.cost)}` : '',
    typeof window !== 'undefined' ? shareUrl(encode(input)) : '',
  ]
    .filter(Boolean)
    .join('\n');

  const csvRows: (string | number)[][] = [
    ['Size (nominal)', 'Length (ft)', 'Pieces', 'Board feet each', 'Board feet', 'Linear feet', 'Cost (USD)'],
    ...input.rows.map((src, i) => {
      const r = result.rows[i];
      const preset = sizeById(src.size);
      return [preset ? preset.label : `${fmt(src.t, 3)}×${fmt(src.w, 3)}`, fmt(src.lengthFt, 2), src.pieces, fmt(r.bfPerPiece, 3), fmt(r.bf, 2), fmt(r.linearFt, 1), r.cost != null ? r.cost.toFixed(2) : ''];
    }),
    ['Total', '', result.pieces, '', fmt(result.totalBf, 2), fmt(result.linearFt, 1), result.cost != null ? result.cost.toFixed(2) : ''],
    ...(input.wastePct > 0 ? [[`With ${fmt(input.wastePct, 0)}% waste`, '', '', '', fmt(result.orderBf, 2), '', '']] : []),
  ];

  return (
    <div class="grid gap-5 md:gap-6 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] md:items-start">
      <form class="grid gap-4 min-w-0 grid-cols-[minmax(0,1fr)]" onSubmit={(e) => e.preventDefault()} aria-label="Lumber list">
        <span class="rule-label">Lumber list</span>

        {input.rows.map((r, i) => {
          const res = result.rows[i];
          const preset = sizeById(r.size);
          const custom = !preset;
          const quarter = custom ? QUARTERS.find((q) => q.t === r.t)?.id : undefined;
          return (
            <fieldset key={r.id} class="rounded-card border border-border bg-surface-sunken p-3.5 grid gap-3.5 min-w-0">
              <legend class="px-2 ml-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted bg-surface border border-border rounded-full py-0.5">Item {i + 1}</legend>

              <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))] items-end">
                <div class="flex flex-col gap-1.5 min-w-0">
                  <label for={`${r.id}-size`} class="text-[0.8125rem] font-semibold text-text leading-tight">
                    Nominal size
                  </label>
                  <select
                    id={`${r.id}-size`}
                    class="h-12 w-full min-w-0 pl-3 pr-9 rounded-field border border-border bg-surface text-base font-medium outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
                    value={custom ? quarter ?? 'custom' : r.size}
                    onChange={(e) => setSize(r.id, (e.currentTarget as HTMLSelectElement).value)}
                  >
                    <optgroup label="Softwood (nominal, actual)">
                      {SIZES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label} — actual {s.dressed}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Hardwood thickness">
                      {QUARTERS.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.id} ({fmt(q.t, 2)} in) — any width
                        </option>
                      ))}
                    </optgroup>
                    <option value="custom">Custom size…</option>
                  </select>
                </div>
                {custom && (
                  <>
                    <NumberInput label="Thickness" unit="in" value={r.t} onChange={(t) => updateRow(r.id, { t })} hint="Nominal or rough" />
                    <NumberInput label="Width" unit="in" value={r.w} onChange={(w) => updateRow(r.id, { w })} hint="Nominal or rough" />
                  </>
                )}
                <NumberInput label="Length" unit="ft" feet value={r.lengthFt} onChange={(lengthFt) => updateRow(r.id, { lengthFt })} hint={`Type 8 or 8'6"`} />
                <NumberInput label="Pieces" integer min={0} max={MAX_PIECES} steppers value={r.pieces} onChange={(pieces) => updateRow(r.id, { pieces })} />
                <NumberInput label="Price" unit="$" value={r.price ?? NaN} onChange={(v) => updateRow(r.id, { price: Number.isFinite(v) ? v : undefined })} hint="Optional" />
                <Segmented label="Price per" value={r.basis} onChange={(basis) => updateRow(r.id, { basis })} options={BASES} size="sm" />
              </div>

              <div class="flex items-center justify-between gap-2 min-w-0">
                <p class="figure m-0 text-[0.6875rem] font-mono text-muted min-w-0">
                  {res.error ? <span class="text-error">{res.error}</span> : `${fmt(res.bfPerPiece, 3)} bd ft each · ${fmt(res.bf, 2)} bd ft · ${fmt(res.linearFt, 1)} lin ft`}
                </p>
                {input.rows.length > 1 && (
                  <button type="button" class="min-h-10 px-2 text-[0.8125rem] font-medium text-muted hover:text-error transition-colors shrink-0" onClick={() => removeRow(r.id)} aria-label={`Remove item ${i + 1}`}>
                    Remove
                  </button>
                )}
              </div>
            </fieldset>
          );
        })}

        <button
          type="button"
          onClick={addRow}
          class="min-h-12 rounded-field border border-dashed border-accent-line text-accent text-[0.9375rem] font-semibold hover:bg-accent-soft hover:border-accent transition-colors"
        >
          + Add another size
        </button>

        <NumberInput label="Extra for waste & defects" unit="%" integer min={0} max={MAX_WASTE_PCT} steppers value={input.wastePct} onChange={(wastePct) => update({ wastePct })} hint="Optional; adds to board feet and cost" />
      </form>

      <div class="grid gap-3 md:sticky md:top-28">
        <ResultCard
          id="bf-result"
          primaryLabel={input.wastePct > 0 ? `Board feet (incl. ${fmt(input.wastePct, 0)}% extra)` : 'Board feet'}
          primary={primary}
          secondary={[
            { label: 'Pieces', value: `${result.pieces}` },
            { label: 'Linear feet', value: `${fmt(result.linearFt, 1)} ft` },
            { label: 'Nominal cubic feet', value: `${fmt(result.cubicFt, 2)} ft³`, hint: 'Board feet ÷ 12' },
            ...(input.wastePct > 0 ? [{ label: 'Bd ft without extra', value: fmt(result.totalBf, 2) }] : []),
            ...(result.cost != null ? [{ label: 'Estimated cost', value: fmtMoney(result.cost) }] : []),
          ]}
          note={
            <>
              Board feet use nominal sizes, as lumber is sold (PS 20): a 2×4 counts as 2 × 4 in although it measures 1½ × 3½ in.
              {result.warnings.map((w) => (
                <span key={w} class="block text-warn mt-1">
                  {w}
                </span>
              ))}
            </>
          }
          steps={result.steps}
          actions={
            <>
              <CopyButton text={summary} />
              <ShareButton url={hydrated ? shareUrl(encode(input)) : ''} title="Board foot calculator result" />
              <PrintButton />
              <CsvButton filename="lumber-list" rows={csvRows} />
            </>
          }
        />

        <ResultTable
          caption="Board feet per piece"
          columns={['Size', '8 ft', '12 ft', '16 ft']}
          rows={SIZES.filter((s) => ['1x6', '2x4', '2x6', '2x8', '2x10', '4x4'].includes(s.id)).map((s) => [s.label, fmt((s.t * s.w * 8) / 12, 2), fmt((s.t * s.w * 12) / 12, 2), fmt((s.t * s.w * 16) / 12, 2)])}
          compact
        />
      </div>

      <StickyResult watchId="bf-result" label="Board feet" value={primary} secondary={`${result.pieces} pcs`} />
    </div>
  );
}
