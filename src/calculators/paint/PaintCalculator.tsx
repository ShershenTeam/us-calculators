import { useEffect, useMemo, useState } from 'preact/hooks';
import { NumberInput, Segmented, UnitToggle, ResultCard, ResultTable, StickyResult, CopyButton, ShareButton, PrintButton, CsvButton } from '@/components/ui';
import { fmt, fmtMoney } from '@/lib/format';
import { readParams, writeParams, shareUrl, compact } from '@/lib/url-state';
import { M_PER_FT, FT_PER_M, M2_PER_FT2 } from '@/lib/area';
import {
  calculatePaint,
  describeBuy,
  ft2PerGalToM2PerL,
  m2PerLToFt2PerGal,
  DEFAULT_INPUT,
  DEFAULT_COVERAGE_FT2,
  DOOR_FT2,
  WINDOW_FT2,
  MAX_COATS,
  MAX_QTY,
  L_PER_GAL,
} from './logic';
import type { PaintInput, SurfaceInput, SurfaceKind } from './types';

/**
 * Paint calculator island. Server-rendered with the default example, hydrated on load.
 * Rooms (four walls + optional ceiling), single walls or a known area · doors and windows ·
 * coats · coverage from the can (data-sheet presets) · primer · what to buy in buckets,
 * gallons and quarts, walls and ceiling separately · sticky result · Copy/Share/Print/CSV.
 * Brief: docs/briefs/paint-calculator.md
 */

const KINDS: { value: SurfaceKind; label: string }[] = [
  { value: 'room', label: 'Whole room' },
  { value: 'wall', label: 'One wall' },
  { value: 'area', label: 'Known area' },
];

/** Coverage presets — manufacturer data sheets, brief §3. */
const COVERAGE_PRESETS = [
  { id: 'c350', ft2: 350, label: '350 ft²' },
  { id: 'c400', ft2: 400, label: '400 ft²' },
  { id: 'c450', ft2: 450, label: '450 ft²' },
] as const;

let seq = 1;
const newId = () => `p${Date.now().toString(36)}${seq++}`;

/* ---------- URL state ---------- */

const KIND_CODES: Record<SurfaceKind, string> = { room: 'rm', wall: 'w', area: 'ar' };
const CODE_KINDS: Record<string, SurfaceKind> = { rm: 'room', w: 'wall', ar: 'area' };

function encode(input: PaintInput): URLSearchParams {
  const p = new URLSearchParams();
  p.set('u', input.units === 'metric' ? 'met' : 'imp');
  p.set(
    's',
    input.surfaces
      .map((s) =>
        [
          KIND_CODES[s.kind],
          compact(s.a),
          s.b != null ? compact(s.b) : '',
          s.c != null ? compact(s.c) : '',
          s.ceiling ? '1' : '',
          String(s.doors || ''),
          String(s.windows || ''),
          s.qty > 1 ? String(s.qty) : '',
          encodeURIComponent(s.name.slice(0, 40)),
        ].join(':'),
      )
      .join(';'),
  );
  p.set('coats', String(input.coats));
  p.set('cov', compact(input.coverage));
  if (input.primer) {
    p.set('pr', '1');
    p.set('pcov', compact(input.primerCoverage));
  }
  const defDoor = input.units === 'metric' ? DOOR_FT2 * M2_PER_FT2 : DOOR_FT2;
  const defWin = input.units === 'metric' ? WINDOW_FT2 * M2_PER_FT2 : WINDOW_FT2;
  if (Math.abs(input.doorArea - defDoor) > 1e-6) p.set('door', compact(input.doorArea));
  if (Math.abs(input.windowArea - defWin) > 1e-6) p.set('win', compact(input.windowArea));
  if (input.price != null && Number.isFinite(input.price)) p.set('p', compact(input.price));
  return p;
}

function decode(p: URLSearchParams, defaults: PaintInput): PaintInput {
  if (!p.has('s')) return defaults;
  const n = (v: string | null | undefined, fb: number | undefined) => {
    if (v == null || v === '') return fb;
    const x = Number(v);
    return Number.isFinite(x) ? x : fb;
  };
  const units = p.get('u') === 'met' ? 'metric' : 'imperial';
  const surfaces: SurfaceInput[] = (p.get('s') ?? '')
    .split(';')
    .filter(Boolean)
    .slice(0, 50)
    .map((chunk, i) => {
      const [k, a, b, c, ceil, doors, windows, qty, name] = chunk.split(':');
      let decoded = '';
      try {
        decoded = decodeURIComponent(name ?? '');
      } catch {
        decoded = '';
      }
      return {
        id: newId(),
        name: decoded.slice(0, 40) || `Room ${i + 1}`,
        kind: CODE_KINDS[k ?? ''] ?? 'room',
        a: n(a, 12)!,
        b: n(b, undefined),
        c: n(c, undefined),
        ceiling: ceil === '1',
        doors: n(doors, 0)!,
        windows: n(windows, 0)!,
        qty: n(qty, 1)!,
      };
    });
  const defCov = units === 'metric' ? Number(ft2PerGalToM2PerL(DEFAULT_COVERAGE_FT2).toFixed(2)) : DEFAULT_COVERAGE_FT2;
  return {
    units,
    surfaces: surfaces.length ? surfaces : defaults.surfaces,
    coats: n(p.get('coats'), 2)!,
    coverage: n(p.get('cov'), defCov)!,
    primer: p.get('pr') === '1',
    primerCoverage: n(p.get('pcov'), defCov)!,
    doorArea: n(p.get('door'), units === 'metric' ? Number((DOOR_FT2 * M2_PER_FT2).toFixed(2)) : DOOR_FT2)!,
    windowArea: n(p.get('win'), units === 'metric' ? Number((WINDOW_FT2 * M2_PER_FT2).toFixed(2)) : WINDOW_FT2)!,
    price: n(p.get('p'), undefined),
  };
}

/* ---------- component ---------- */

export default function PaintCalculator() {
  const [input, setInput] = useState<PaintInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInput(decode(readParams(), DEFAULT_INPUT));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeParams(encode(input));
  }, [input, hydrated]);

  const result = useMemo(() => calculatePaint(input), [input]);
  const metric = input.units === 'metric';
  const len = metric ? 'm' : 'ft';
  const sq = metric ? 'm²' : 'ft²';
  const covUnit = metric ? 'm²/L' : 'ft²/gal';

  const update = (patch: Partial<PaintInput>) => setInput((s) => ({ ...s, ...patch }));
  const updateS = (id: string, patch: Partial<SurfaceInput>) => setInput((s) => ({ ...s, surfaces: s.surfaces.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const setKind = (id: string, kind: SurfaceKind) =>
    setInput((s) => ({
      ...s,
      surfaces: s.surfaces.map((x) => {
        if (x.id !== id || x.kind === kind) return x;
        if (kind === 'room') return { ...x, kind, a: metric ? 3.5 : 12, b: metric ? 3.5 : 12, c: metric ? 2.4 : 8 };
        if (kind === 'wall') return { ...x, kind, a: metric ? 3.5 : 12, b: metric ? 2.4 : 8, c: undefined, ceiling: false };
        return { ...x, kind, a: metric ? 30 : 300, b: undefined, c: undefined, ceiling: false };
      }),
    }));
  const addSurface = () =>
    setInput((s) => ({
      ...s,
      surfaces: [...s.surfaces, { id: newId(), name: `Room ${s.surfaces.length + 1}`, kind: 'room', a: metric ? 3 : 10, b: metric ? 3.5 : 12, c: metric ? 2.4 : 8, ceiling: false, doors: 1, windows: 1, qty: 1 }],
    }));
  const removeSurface = (id: string) => setInput((s) => ({ ...s, surfaces: s.surfaces.length > 1 ? s.surfaces.filter((x) => x.id !== id) : s.surfaces }));

  const switchUnits = (units: PaintInput['units']) => {
    if (units === input.units) return;
    const k = units === 'metric' ? M_PER_FT : FT_PER_M;
    const k2 = k * k;
    const r = (v: number | undefined, d = 2) => (v != null && Number.isFinite(v) ? Number(v.toFixed(d)) : v);
    const cov = (v: number) => (units === 'metric' ? r(ft2PerGalToM2PerL(v), 2)! : r(m2PerLToFt2PerGal(v), 0)!);
    setInput((s) => ({
      ...s,
      units,
      surfaces: s.surfaces.map((x) => ({ ...x, a: x.kind === 'area' ? r(x.a * k2)! : r(x.a * k)!, b: r(x.b != null ? x.b * k : undefined), c: r(x.c != null ? x.c * k : undefined) })),
      coverage: cov(s.coverage),
      primerCoverage: cov(s.primerCoverage),
      doorArea: r(s.doorArea * k2)!,
      windowArea: r(s.windowArea * k2)!,
      price: undefined,
    }));
  };

  const covFt2 = metric ? m2PerLToFt2PerGal(input.coverage) : input.coverage;
  const activeCov = COVERAGE_PRESETS.find((p) => Math.abs(p.ft2 - covFt2) < 0.6)?.id ?? 'custom';

  const vol = (gal: number) => (metric ? `${fmt(gal * L_PER_GAL, 1)} L` : `${fmt(gal, 2)} gal`);
  const primary = metric ? `${fmt(result.wallL, 1, true)} L` : describeBuy(result.wallBuy);
  const area = (ft2: number) => (metric ? `${fmt(ft2 * M2_PER_FT2, 1)} m²` : `${fmt(ft2, 0)} ft²`);

  const summary = [
    `Wall paint: ${metric ? `${fmt(result.wallL, 1)} L` : `${describeBuy(result.wallBuy)} (${fmt(result.wallGal, 2)} gal needed)`} for ${area(result.wallFt2)}, ${input.coats} coats`,
    result.ceilingFt2 > 0 ? `Ceiling paint: ${metric ? `${fmt(result.ceilingL, 1)} L` : describeBuy(result.ceilingBuy)} for ${area(result.ceilingFt2)}` : '',
    result.primerGal > 0 ? `Primer: ${metric ? `${fmt(result.primerL, 1)} L` : describeBuy(result.primerBuy)}` : '',
    ...result.surfaces.filter((s) => !s.error).map((s) => `  ${s.name}: walls ${area(s.wallFt2)}${s.ceilingFt2 > 0 ? `, ceiling ${area(s.ceilingFt2)}` : ''}`),
    result.cost != null ? `Cost: ${fmtMoney(result.cost)}` : '',
    typeof window !== 'undefined' ? shareUrl(encode(input)) : '',
  ]
    .filter(Boolean)
    .join('\n');

  const csvRows: (string | number)[][] = [
    ['Surface', 'Type', 'Qty', 'Walls (ft²)', 'Ceiling (ft²)', 'Doors & windows (ft²)'],
    ...result.surfaces.filter((s) => !s.error).map((s) => [s.name, s.kind, s.qty, fmt(s.wallFt2, 1), fmt(s.ceilingFt2, 1), fmt(s.openingsFt2, 1)]),
    ['Total', '', '', fmt(result.wallFt2, 1), fmt(result.ceilingFt2, 1), ''],
    [`Wall paint, ${input.coats} coats (gal)`, '', '', fmt(result.wallGal, 3), '', describeBuy(result.wallBuy)],
    ...(result.ceilingFt2 > 0 ? [[`Ceiling paint, ${input.coats} coats (gal)`, '', '', fmt(result.ceilingGal, 3), '', describeBuy(result.ceilingBuy)]] : []),
    ...(result.primerGal > 0 ? [['Primer, 1 coat (gal)', '', '', fmt(result.primerGal, 3), '', describeBuy(result.primerBuy)]] : []),
    ...(result.cost != null ? [['Cost (USD)', '', '', result.cost.toFixed(2), '', '']] : []),
  ];

  return (
    <div class="grid gap-5 md:gap-6 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] md:items-start">
      <form class="grid gap-4 min-w-0 grid-cols-[minmax(0,1fr)]" onSubmit={(e) => e.preventDefault()} aria-label="Paint inputs">
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0">
          <span class="rule-label shrink-0 after:hidden">What you are painting</span>
          <UnitToggle value={input.units} onChange={switchUnits} />
        </div>

        {input.surfaces.map((s, i) => {
          const res = result.surfaces.find((r) => r.id === s.id);
          const err = (v: number | undefined) => (res?.error && !(v != null && v >= 0) ? 'Enter 0 or more' : undefined);
          return (
            <fieldset key={s.id} class="rounded-card border border-border bg-surface-sunken p-3.5 grid gap-3.5 min-w-0">
              <legend class="px-2 ml-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted bg-surface border border-border rounded-full py-0.5">
                {s.kind === 'room' ? 'Room' : s.kind === 'wall' ? 'Wall' : 'Surface'} {i + 1}
              </legend>

              <div class="flex items-center gap-2 min-w-0">
                <div class="relative flex-1 min-w-0">
                  <label for={`${s.id}-name`} class="sr-only">
                    Name
                  </label>
                  <svg
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  <input
                    id={`${s.id}-name`}
                    type="text"
                    data-kind="label"
                    enterKeyHint="next"
                    maxLength={40}
                    autoComplete="off"
                    placeholder="Room name"
                    value={s.name}
                    onInput={(e) => updateS(s.id, { name: e.currentTarget.value })}
                    class="w-full h-11 pl-9 pr-3 rounded-field border border-transparent bg-transparent text-text text-base font-semibold outline-none transition-colors hover:border-border focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/15"
                  />
                </div>
                {input.surfaces.length > 1 && (
                  <button
                    type="button"
                    class="min-h-12 px-2 text-[0.8125rem] font-medium text-muted hover:text-error transition-colors"
                    onClick={() => removeSurface(s.id)}
                    aria-label={`Remove ${s.name || `room ${i + 1}`}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div class="order-last sm:order-none">
                <Segmented label={`What to paint in ${s.name || `room ${i + 1}`}`} hideLabel size="sm" value={s.kind} onChange={(k) => setKind(s.id, k)} options={KINDS} />
              </div>

              <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))] items-end">
                {s.kind === 'room' && (
                  <>
                    <NumberInput label="Length" unit={len} feet={!metric} value={s.a} onChange={(a) => updateS(s.id, { a })} error={err(s.a)} />
                    <NumberInput label="Width" unit={len} feet={!metric} value={s.b ?? NaN} onChange={(b) => updateS(s.id, { b })} error={err(s.b)} />
                    <NumberInput label="Wall height" hint={metric ? 'Often 2.4 m' : 'Often 8 ft'} unit={len} feet={!metric} value={s.c ?? NaN} onChange={(c) => updateS(s.id, { c })} error={err(s.c)} />
                  </>
                )}
                {s.kind === 'wall' && (
                  <>
                    <NumberInput label="Wall width" unit={len} feet={!metric} value={s.a} onChange={(a) => updateS(s.id, { a })} error={err(s.a)} />
                    <NumberInput label="Wall height" unit={len} feet={!metric} value={s.b ?? NaN} onChange={(b) => updateS(s.id, { b })} error={err(s.b)} />
                  </>
                )}
                {s.kind === 'area' && <NumberInput label="Area to paint" unit={sq} value={s.a} onChange={(a) => updateS(s.id, { a })} error={err(s.a)} />}
                {s.kind !== 'area' && (
                  <>
                    <NumberInput label="Doors" integer min={0} max={50} steppers value={s.doors} onChange={(doors) => updateS(s.id, { doors })} />
                    <NumberInput label="Windows" integer min={0} max={50} steppers value={s.windows} onChange={(windows) => updateS(s.id, { windows })} />
                  </>
                )}
                {s.kind === 'room' && (
                  <Segmented
                    label="Ceiling too?"
                    value={s.ceiling ? 'yes' : 'no'}
                    onChange={(v) => updateS(s.id, { ceiling: v === 'yes' })}
                    options={[
                      { value: 'no', label: 'Walls only' },
                      { value: 'yes', label: '+ Ceiling' },
                    ]}
                  />
                )}
                <NumberInput label={s.kind === 'room' ? 'Identical rooms' : 'Identical walls'} integer min={1} max={MAX_QTY} steppers value={s.qty} onChange={(qty) => updateS(s.id, { qty })} />
              </div>

              {res && !res.error && (
                <p class="figure m-0 text-[0.6875rem] font-mono text-muted">
                  walls {area(res.wallFt2)}
                  {res.ceilingFt2 > 0 ? ` · ceiling ${area(res.ceilingFt2)}` : ''}
                  {res.openingsFt2 > 0 ? ` · ${area(res.openingsFt2)} doors & windows left out` : ''}
                </p>
              )}
            </fieldset>
          );
        })}

        <button
          type="button"
          onClick={addSurface}
          class="min-h-12 rounded-field border border-dashed border-accent-line text-accent text-[0.9375rem] font-semibold hover:bg-accent-soft hover:border-accent transition-colors"
        >
          + Add another room or wall
        </button>

        <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] items-end">
          <NumberInput label="Coats" integer min={1} max={MAX_COATS} steppers value={input.coats} onChange={(coats) => update({ coats })} hint="Two coats is what the makers recommend" />
          <Segmented
            label="Coverage preset"
            value={activeCov}
            onChange={(id) => {
              const p = COVERAGE_PRESETS.find((x) => x.id === id);
              if (p) update({ coverage: metric ? Number(ft2PerGalToM2PerL(p.ft2).toFixed(2)) : p.ft2 });
            }}
            options={[...COVERAGE_PRESETS.map((p) => ({ value: p.id, label: p.label })), ...(activeCov === 'custom' ? [{ value: 'custom' as const, label: 'Custom' }] : [])]}
          />
        </div>

        <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] items-end">
          <NumberInput label="Coverage" unit={covUnit} value={input.coverage} onChange={(coverage) => update({ coverage })} hint="Per coat, from the label or data sheet" />
          <Segmented
            label="Primer"
            value={input.primer ? 'yes' : 'no'}
            onChange={(v) => update({ primer: v === 'yes' })}
            options={[
              { value: 'no', label: 'No primer' },
              { value: 'yes', label: '+ 1 coat primer' },
            ]}
          />
        </div>

        <details class="group rounded-card border border-border bg-surface-sunken p-3.5" open={input.price != null || input.primer}>
          <summary class="cursor-pointer list-none text-[0.875rem] font-semibold min-h-9 flex items-center gap-2 text-text">
            <span
              aria-hidden="true"
              class="grid place-items-center h-5 w-5 rounded-full border border-border text-[0.65rem] leading-none text-muted transition-transform duration-200 group-open:rotate-90"
            >
              ▸
            </span>
            Door & window size, primer, price <span class="font-normal text-muted">(optional)</span>
          </summary>
          <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] mt-3 items-end">
            <NumberInput label="One door" unit={sq} value={input.doorArea} onChange={(doorArea) => update({ doorArea })} hint={metric ? '0.91 × 2.03 m = 1.86 m²' : '36 × 80 in = 20 ft²'} />
            <NumberInput label="One window" unit={sq} value={input.windowArea} onChange={(windowArea) => update({ windowArea })} hint={metric ? '0.9 × 1.2 m ≈ 1.1 m²' : '3 × 4 ft = 12 ft²'} />
            {input.primer && <NumberInput label="Primer coverage" unit={covUnit} value={input.primerCoverage} onChange={(primerCoverage) => update({ primerCoverage })} hint="From the primer can" />}
            <NumberInput label={metric ? 'Paint price per litre' : 'Paint price per gallon'} unit="$" value={input.price ?? NaN} onChange={(v) => update({ price: Number.isFinite(v) ? v : undefined })} hint="Leave empty to skip cost" />
          </div>
        </details>
      </form>

      <div class="grid gap-3 md:sticky md:top-28">
        <ResultCard
          id="paint-result"
          primaryLabel={metric ? `Wall paint, ${input.coats} coats` : `Wall paint to buy, ${input.coats} coats`}
          primary={primary}
          secondary={[
            { label: 'Exactly needed', value: vol(result.wallGal) },
            { label: 'Wall area', value: area(result.wallFt2) },
            ...(result.ceilingFt2 > 0 ? [{ label: 'Ceiling paint', value: metric ? vol(result.ceilingGal) : describeBuy(result.ceilingBuy), hint: area(result.ceilingFt2) }] : []),
            ...(result.primerGal > 0 ? [{ label: 'Primer', value: metric ? vol(result.primerGal) : describeBuy(result.primerBuy) }] : []),
            metric ? { label: 'In gallons', value: `${fmt(result.wallGal, 2)} gal` } : { label: 'In litres', value: `${fmt(result.wallL, 1)} L` },
            ...(result.cost != null ? [{ label: 'Estimated cost', value: fmtMoney(result.cost) }] : []),
          ]}
          note={
            <>
              Coverage {fmt(covFt2, 0)} sq ft per gallon per coat. Rounded up to whole quarts; three quarts are bought as a gallon.
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
              <ShareButton url={hydrated ? shareUrl(encode(input)) : ''} title="Paint calculator result" />
              <PrintButton />
              <CsvButton filename="paint-estimate" rows={csvRows} />
            </>
          }
        />

        <ResultTable
          caption="One gallon covers, per coat"
          columns={['Coverage', '1 coat', '2 coats']}
          rows={COVERAGE_PRESETS.map((p) =>
            metric
              ? [`${fmt(ft2PerGalToM2PerL(p.ft2), 1)} m²/L`, `${fmt(p.ft2 * M2_PER_FT2, 1)} m²`, `${fmt((p.ft2 * M2_PER_FT2) / 2, 1)} m²`]
              : [`${p.ft2} ft²/gal`, `${p.ft2} ft²`, `${p.ft2 / 2} ft²`],
          )}
          compact
        />
      </div>

      <StickyResult watchId="paint-result" label="Wall paint" value={primary} secondary={result.ceilingFt2 > 0 ? `+ ceiling ${metric ? vol(result.ceilingGal) : describeBuy(result.ceilingBuy)}` : area(result.wallFt2)} />
    </div>
  );
}
