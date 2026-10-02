import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  NumberInput,
  Segmented,
  UnitToggle,
  ResultCard,
  ResultTable,
  StickyResult,
  ShapePicker,
  CopyButton,
  ShareButton,
  PrintButton,
  CsvButton,
} from '@/components/ui';
import { fmt, fmtMoney } from '@/lib/format';
import { readParams, writeParams, shareUrl, compact } from '@/lib/url-state';
import { withShape, SHAPE_CODES, CODE_SHAPES, M_PER_FT, FT_PER_M } from '@/lib/area';
import {
  calculateCubicYards,
  convertDepth,
  coveragePerYd3Ft2,
  ft3ToM3,
  DEFAULT_INPUT,
  BAG_SIZES_FT3,
  BAG_SIZES_L,
  MAX_EXTRA_PCT,
  MAX_QTY,
  COVERAGE_DEPTHS_IN,
  L_PER_FT3,
} from './logic';
import type { AreaInput, CubicYardsInput, DepthUnit, PriceUnit, Shape } from './types';

/**
 * Cubic yards calculator island. Server-rendered with the default example, hydrated on load.
 * Named areas of any shape, each with its own depth · quantity (post holes, footings) ·
 * in/ft or cm/m depth · extra % · ½-yard suggested order · bags · price ·
 * "How it's calculated" · sticky result · Copy/Share/Print/CSV.
 * Brief: docs/briefs/cubic-yards-calculator.md
 */

const SHAPES: { value: Shape; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'lshape', label: 'L-shape' },
  { value: 'circle', label: 'Circle / hole' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'trapezoid', label: 'Trapezoid' },
  { value: 'area', label: 'Known area' },
];

const SHAPE_NAMES: Record<Shape, string> = {
  rectangle: 'rectangle',
  lshape: 'L-shape',
  circle: 'circle',
  triangle: 'triangle',
  trapezoid: 'trapezoid',
  area: 'known area',
};

let seq = 1;
const newId = () => `a${Date.now().toString(36)}${seq++}`;

/* ---------- URL state ---------- */

const DEPTH_UNITS: DepthUnit[] = ['in', 'ft', 'cm', 'm'];
const PRICE_UNITS: PriceUnit[] = ['yd3', 'ft3', 'm3', 'bag'];

function encode(input: CubicYardsInput): URLSearchParams {
  const p = new URLSearchParams();
  p.set('u', input.units === 'metric' ? 'met' : 'imp');
  p.set('du', input.depthUnit);
  p.set(
    'a',
    input.areas
      .map((a) =>
        [
          SHAPE_CODES[a.shape],
          compact(a.a),
          a.b != null ? compact(a.b) : '',
          a.c != null ? compact(a.c) : '',
          a.d != null ? compact(a.d) : '',
          compact(a.depth),
          a.qty > 1 ? String(a.qty) : '',
          encodeURIComponent(a.name.slice(0, 40)),
        ].join(':'),
      )
      .join(';'),
  );
  p.set('x', compact(input.extraPct));
  p.set('bag', compact(input.bagSize));
  if (input.price != null && Number.isFinite(input.price)) {
    p.set('p', compact(input.price));
    p.set('pu', input.priceUnit);
  }
  return p;
}

function decode(p: URLSearchParams, defaults: CubicYardsInput): CubicYardsInput {
  if (!p.has('a')) return defaults;
  const n = (v: string | null | undefined, fb: number | undefined) => {
    if (v == null || v === '') return fb;
    const x = Number(v);
    return Number.isFinite(x) ? x : fb;
  };
  const units = p.get('u') === 'met' ? 'metric' : 'imperial';
  const du = p.get('du') as DepthUnit | null;
  const allowed: DepthUnit[] = units === 'metric' ? ['cm', 'm'] : ['in', 'ft'];
  const depthUnit = du && allowed.includes(du) ? du : allowed[0];
  const areas: AreaInput[] = (p.get('a') ?? '')
    .split(';')
    .filter(Boolean)
    .slice(0, 50)
    .map((chunk, i) => {
      const [code, a, b, c, d, depth, qty, name] = chunk.split(':');
      const shape = CODE_SHAPES[code ?? ''] ?? 'rectangle';
      let decoded = '';
      try {
        decoded = decodeURIComponent(name ?? '');
      } catch {
        decoded = '';
      }
      return withShape<AreaInput>(
        {
          id: newId(),
          name: decoded.slice(0, 40) || `Area ${i + 1}`,
          shape,
          a: n(a, 10)!,
          b: n(b, undefined),
          c: n(c, undefined),
          d: n(d, undefined),
          depth: n(depth, 4)!,
          qty: n(qty, 1)!,
        },
        shape,
      );
    });
  const pu = p.get('pu') as PriceUnit | null;
  return {
    units,
    depthUnit,
    areas: areas.length ? areas : defaults.areas,
    extraPct: Math.min(MAX_EXTRA_PCT, Math.max(0, n(p.get('x'), defaults.extraPct)!)),
    bagSize: n(p.get('bag'), units === 'metric' ? 50 : defaults.bagSize)!,
    price: n(p.get('p'), undefined),
    priceUnit: pu && PRICE_UNITS.includes(pu) ? pu : 'yd3',
  };
}

/* ---------- component ---------- */

export default function CubicYardsCalculator() {
  const [input, setInput] = useState<CubicYardsInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInput(decode(readParams(), DEFAULT_INPUT));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeParams(encode(input));
  }, [input, hydrated]);

  const result = useMemo(() => calculateCubicYards(input), [input]);
  const metric = input.units === 'metric';
  const len = metric ? 'm' : 'ft';
  const sq = metric ? 'm²' : 'ft²';
  const du = input.depthUnit;

  const update = (patch: Partial<CubicYardsInput>) => setInput((s) => ({ ...s, ...patch }));
  const updateArea = (id: string, patch: Partial<AreaInput>) =>
    setInput((s) => ({ ...s, areas: s.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  const setShape = (id: string, shape: Shape) =>
    setInput((s) => ({ ...s, areas: s.areas.map((a) => (a.id === id ? withShape(a, shape) : a)) }));
  const addArea = () =>
    setInput((s) => {
      const last = s.areas.at(-1);
      return {
        ...s,
        areas: [
          ...s.areas,
          { id: newId(), name: `Area ${s.areas.length + 1}`, shape: 'rectangle', a: metric ? 3 : 10, b: metric ? 3 : 10, depth: last?.depth ?? (metric ? 10 : 4), qty: 1 },
        ],
      };
    });
  const removeArea = (id: string) => setInput((s) => ({ ...s, areas: s.areas.length > 1 ? s.areas.filter((a) => a.id !== id) : s.areas }));

  const setDepthUnit = (to: DepthUnit) => {
    if (to === input.depthUnit) return;
    setInput((s) => ({
      ...s,
      depthUnit: to,
      areas: s.areas.map((a) => ({ ...a, depth: Number(convertDepth(a.depth, s.depthUnit, to).toFixed(3)) })),
    }));
  };

  const switchUnits = (units: CubicYardsInput['units']) => {
    if (units === input.units) return;
    const k = units === 'metric' ? M_PER_FT : FT_PER_M;
    const r = (v: number | undefined, d = 3) => (v != null && Number.isFinite(v) ? Number(v.toFixed(d)) : v);
    const toDepth: DepthUnit = units === 'metric' ? (input.depthUnit === 'ft' ? 'm' : 'cm') : input.depthUnit === 'm' ? 'ft' : 'in';
    setInput((s) => ({
      ...s,
      units,
      depthUnit: toDepth,
      areas: s.areas.map((a) => ({
        ...a,
        a: a.shape === 'area' ? r(a.a * k * k, 2)! : r(a.a * k)!,
        b: r(a.b != null ? a.b * k : undefined),
        c: r(a.c != null ? a.c * k : undefined),
        d: r(a.d != null ? a.d * k : undefined),
        depth: r(convertDepth(a.depth, s.depthUnit, toDepth), 2)!,
      })),
      // Nearest common bag in the other system.
      bagSize: units === 'metric' ? 50 : 2,
      priceUnit: units === 'metric' && (s.priceUnit === 'yd3' || s.priceUnit === 'ft3') ? 'm3' : units === 'imperial' && s.priceUnit === 'm3' ? 'yd3' : s.priceUnit,
      price: undefined,
    }));
  };

  const depthOptions: { value: DepthUnit; label: string }[] = metric
    ? [
        { value: 'cm', label: 'cm' },
        { value: 'm', label: 'm' },
      ]
    : [
        { value: 'in', label: 'inches' },
        { value: 'ft', label: 'feet' },
      ];
  const bagOptions = (metric ? BAG_SIZES_L : BAG_SIZES_FT3).map((v) => ({ value: String(v), label: metric ? `${v} L` : `${v}` }));
  const priceOptions: { value: PriceUnit; label: string }[] = metric
    ? [
        { value: 'm3', label: 'per m³' },
        { value: 'bag', label: 'per bag' },
      ]
    : [
        { value: 'yd3', label: 'per yd³' },
        { value: 'ft3', label: 'per ft³' },
        { value: 'bag', label: 'per bag' },
      ];

  const primary = `${fmt(result.orderYd3, 2)} yd³`;
  const metricPrimary = `${fmt(result.orderM3, 2)} m³`;
  const bagLabel = metric ? `${fmt(input.bagSize, 0)} L bags` : `${fmt(input.bagSize, 2)} ft³ bags`;

  const summary = [
    `To order: ${fmt(result.orderYd3, 2)} yd³ (${fmt(result.orderFt3, 1)} ft³, ${fmt(result.orderM3, 2)} m³) incl. ${fmt(input.extraPct, 0)}% extra`,
    `Without extra: ${fmt(result.volumeYd3, 3)} yd³`,
    ...result.areas.filter((a) => !a.error).map((a) => `  ${a.name}: ${fmt(a.volumeFt3, 2)} ft³`),
    `Suggested bulk order: ${fmt(result.suggestedYd3, 1)} yd³`,
    result.bags > 0 ? `Bags: ${result.bags} × ${bagLabel}` : '',
    result.cost != null ? `Cost: ${fmtMoney(result.cost)}` : '',
    typeof window !== 'undefined' ? shareUrl(encode(input)) : '',
  ]
    .filter(Boolean)
    .join('\n');

  const csvRows: (string | number)[][] = [
    ['Area', 'Shape', 'Qty', 'Area (ft²)', 'Depth (ft)', 'Volume (ft³)', 'Volume (yd³)', 'Volume (m³)'],
    ...result.areas
      .filter((a) => !a.error)
      .map((a) => [a.name, SHAPE_NAMES[a.shape], a.qty, fmt(a.areaFt2, 2), fmt(a.depthFt, 3), fmt(a.volumeFt3, 2), fmt(a.volumeFt3 / 27, 3), fmt(ft3ToM3(a.volumeFt3), 3)]),
    ['Total', '', '', fmt(result.areaFt2, 2), '', fmt(result.volumeFt3, 2), fmt(result.volumeYd3, 3), fmt(result.volumeM3, 3)],
    [`With ${fmt(input.extraPct, 0)}% extra`, '', '', '', '', fmt(result.orderFt3, 2), fmt(result.orderYd3, 3), fmt(result.orderM3, 3)],
    ['Suggested bulk order', '', '', '', '', '', fmt(result.suggestedYd3, 1), ''],
    ...(result.bags > 0 ? [[`Bags (${bagLabel})`, '', result.bags, '', '', '', '', '']] : []),
    ...(result.cost != null ? [['Cost (USD)', '', '', '', '', '', result.cost.toFixed(2), '']] : []),
  ];

  return (
    <div class="grid gap-5 md:gap-6 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] md:items-start">
      <form class="grid gap-4 min-w-0 grid-cols-[minmax(0,1fr)]" onSubmit={(e) => e.preventDefault()} aria-label="Cubic yards inputs">
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0">
          <span class="rule-label shrink-0 after:hidden">Areas to fill</span>
          <div class="flex items-center gap-2">
            <Segmented label="Depth unit" hideLabel size="sm" value={du} onChange={setDepthUnit} options={depthOptions} />
            <UnitToggle value={input.units} onChange={switchUnits} />
          </div>
        </div>

        {input.areas.map((area, i) => {
          const res = result.areas.find((r) => r.id === area.id);
          const err = (v: number | undefined) => (res?.error && !(v != null && v >= 0) ? 'Enter 0 or more' : undefined);
          const isHole = area.shape === 'circle';
          return (
            <fieldset key={area.id} class="rounded-card border border-border bg-surface-sunken p-3.5 grid gap-3.5 min-w-0">
              <legend class="px-2 ml-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted bg-surface border border-border rounded-full py-0.5">
                Area {i + 1}
              </legend>

              <div class="flex items-center gap-2 min-w-0">
                <div class="relative flex-1 min-w-0">
                  <label for={`${area.id}-name`} class="sr-only">
                    Area name
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
                    id={`${area.id}-name`}
                    type="text"
                    data-kind="label"
                    enterKeyHint="next"
                    maxLength={40}
                    autoComplete="off"
                    placeholder="Area name"
                    value={area.name}
                    onInput={(e) => updateArea(area.id, { name: e.currentTarget.value })}
                    class="w-full h-11 pl-9 pr-3 rounded-field border border-transparent bg-transparent text-text text-base font-semibold outline-none transition-colors hover:border-border focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/15"
                  />
                </div>
                {input.areas.length > 1 && (
                  <button
                    type="button"
                    class="min-h-12 px-2 text-[0.8125rem] font-medium text-muted hover:text-error transition-colors"
                    onClick={() => removeArea(area.id)}
                    aria-label={`Remove ${area.name || `area ${i + 1}`}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div class="order-last sm:order-none">
                <ShapePicker label={`Shape of ${area.name || `area ${i + 1}`}`} hideLabel value={area.shape} options={SHAPES} onChange={(shape) => setShape(area.id, shape)} />
              </div>

              <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))] items-end">
                {area.shape === 'rectangle' && (
                  <>
                    <NumberInput label="Length" unit={len} feet={!metric} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={err(area.a)} />
                    <NumberInput label="Width" unit={len} feet={!metric} value={area.b ?? NaN} onChange={(b) => updateArea(area.id, { b })} error={err(area.b)} />
                  </>
                )}
                {area.shape === 'lshape' && (
                  <>
                    <NumberInput label="Part 1 length" unit={len} feet={!metric} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={err(area.a)} />
                    <NumberInput label="Part 1 width" unit={len} feet={!metric} value={area.b ?? NaN} onChange={(b) => updateArea(area.id, { b })} error={err(area.b)} />
                    <NumberInput label="Part 2 length" unit={len} feet={!metric} value={area.c ?? NaN} onChange={(c) => updateArea(area.id, { c })} error={err(area.c)} />
                    <NumberInput label="Part 2 width" unit={len} feet={!metric} value={area.d ?? NaN} onChange={(d) => updateArea(area.id, { d })} error={err(area.d)} />
                  </>
                )}
                {area.shape === 'circle' && (
                  <NumberInput label="Diameter" hint={metric ? undefined : `Type 10" for inches`} unit={len} feet={!metric} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={err(area.a)} />
                )}
                {area.shape === 'triangle' && (
                  <>
                    <NumberInput label="Base" unit={len} feet={!metric} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={err(area.a)} />
                    <NumberInput label="Height" unit={len} feet={!metric} value={area.b ?? NaN} onChange={(b) => updateArea(area.id, { b })} error={err(area.b)} />
                  </>
                )}
                {area.shape === 'trapezoid' && (
                  <>
                    <NumberInput label="Side a" hint="One parallel side" unit={len} feet={!metric} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={err(area.a)} />
                    <NumberInput label="Side b" hint="The other parallel side" unit={len} feet={!metric} value={area.b ?? NaN} onChange={(b) => updateArea(area.id, { b })} error={err(area.b)} />
                    <NumberInput label="Width" hint="Distance between them" unit={len} feet={!metric} value={area.c ?? NaN} onChange={(c) => updateArea(area.id, { c })} error={err(area.c)} />
                  </>
                )}
                {area.shape === 'area' && <NumberInput label="Area" unit={sq} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={err(area.a)} />}
                <NumberInput
                  label={isHole ? 'Depth / height' : 'Depth'}
                  unit={du}
                  value={area.depth}
                  onChange={(depth) => updateArea(area.id, { depth })}
                  error={res?.error && !(area.depth >= 0) ? 'Enter 0 or more' : undefined}
                  hint={i === 0 && !isHole ? (metric ? 'Mulch 5–8 cm, compost on new beds 8–10 cm' : 'Mulch 2–3 in, compost on new beds 3–4 in') : undefined}
                />
                <NumberInput
                  label={isHole ? 'How many holes' : 'Identical areas'}
                  integer
                  min={1}
                  max={MAX_QTY}
                  steppers
                  value={area.qty}
                  onChange={(qty) => updateArea(area.id, { qty })}
                />
              </div>

              {res && !res.error && (
                <p class="figure m-0 text-[0.6875rem] font-mono text-muted">
                  {metric ? `${fmt(ft3ToM3(res.volumeFt3), 3)} m³` : `${fmt(res.volumeFt3, 2)} ft³ · ${fmt(res.volumeFt3 / 27, 3)} yd³`}
                  {res.qty > 1 ? ` (${res.qty} pieces)` : ''}
                </p>
              )}
            </fieldset>
          );
        })}

        <button
          type="button"
          onClick={addArea}
          class="min-h-12 rounded-field border border-dashed border-accent-line text-accent text-[0.9375rem] font-semibold hover:bg-accent-soft hover:border-accent transition-colors"
        >
          + Add another area
        </button>

        <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] items-end">
          <NumberInput
            label="Extra for spreading & settling"
            unit="%"
            integer
            min={0}
            max={MAX_EXTRA_PCT}
            steppers
            value={input.extraPct}
            onChange={(extraPct) => update({ extraPct })}
            hint="5–10 % for loose fill; more if you will compact it"
          />
          <Segmented
            label={metric ? 'Bag size (litres)' : 'Bag size (ft³)'}
            value={String(input.bagSize)}
            onChange={(v) => update({ bagSize: Number(v) })}
            options={bagOptions}
          />
        </div>

        <details class="group rounded-card border border-border bg-surface-sunken p-3.5" open={input.price != null}>
          <summary class="cursor-pointer list-none text-[0.875rem] font-semibold min-h-9 flex items-center gap-2 text-text">
            <span
              aria-hidden="true"
              class="grid place-items-center h-5 w-5 rounded-full border border-border text-[0.65rem] leading-none text-muted transition-transform duration-200 group-open:rotate-90"
            >
              ▸
            </span>
            Price <span class="font-normal text-muted">(optional)</span>
          </summary>
          <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] mt-3 items-end">
            <NumberInput label="Price" unit="$" value={input.price ?? NaN} onChange={(v) => update({ price: Number.isFinite(v) ? v : undefined })} hint="Leave empty to skip cost" />
            <Segmented label="Price is" value={input.priceUnit} onChange={(priceUnit) => update({ priceUnit })} options={priceOptions} />
          </div>
        </details>
      </form>

      <div class="grid gap-3 md:sticky md:top-28">
        <ResultCard
          id="yd3-result"
          primaryLabel={`To order (incl. ${fmt(input.extraPct, 0)}% extra)`}
          primary={metric ? metricPrimary : primary}
          secondary={[
            metric ? { label: 'Cubic yards', value: primary } : { label: 'Cubic meters', value: metricPrimary },
            { label: 'Cubic feet', value: `${fmt(result.orderFt3, 1)} ft³` },
            { label: 'Suggested bulk order', value: result.suggestedYd3 > 0 ? `${fmt(result.suggestedYd3, 1)} yd³` : '—', hint: 'Rounded up to the next ½ yard' },
            { label: 'Without extra', value: `${fmt(result.volumeYd3, 2)} yd³` },
            { label: metric ? `Bags (${fmt(input.bagSize, 0)} L)` : `Bags (${fmt(input.bagSize, 2)} ft³)`, value: `${result.bags}` },
            ...(result.cost != null ? [{ label: 'Estimated cost', value: fmtMoney(result.cost) }] : []),
          ]}
          note={
            <>
              {fmt(result.areaFt2, 0)} ft² covered in total. One cubic yard = 27 ft³ = {fmt(L_PER_FT3 * 27, 0)} L.
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
              <ShareButton url={hydrated ? shareUrl(encode(input)) : ''} title="Cubic yards calculator result" />
              <PrintButton />
              <CsvButton filename="cubic-yards" rows={csvRows} />
            </>
          }
        />

        <ResultTable
          caption="What one cubic yard covers"
          columns={['Depth', 'Covers', 'In m²']}
          rows={COVERAGE_DEPTHS_IN.map((d) => [`${d} in`, `${fmt(coveragePerYd3Ft2(d), 0)} ft²`, `${fmt(coveragePerYd3Ft2(d) * M_PER_FT * M_PER_FT, 1)} m²`])}
          compact
        />
      </div>

      <StickyResult watchId="yd3-result" label="To order" value={metric ? metricPrimary : primary} secondary={`${result.bags} bags`} />
    </div>
  );
}
