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
import { withShape, convertDepth, SHAPE_CODES, CODE_SHAPES, M_PER_FT, FT_PER_M } from '@/lib/area';
import { ft3ToM3, MAX_QTY } from '@/calculators/cubic-yards/logic';
import { calculateMulch, bagCoverageFt2, DEFAULT_INPUT, BAG_SIZES_FT3, BAG_SIZES_L, DEPTH_PRESETS_IN, MAX_EXTRA_PCT, L_PER_FT3 } from './logic';
import type { AreaInput, DepthUnit, MulchInput, PriceUnit, Shape } from './types';

/**
 * Mulch calculator island. Server-rendered with the default example, hydrated on load.
 * Beds, borders and tree rings (trunk left bare), each with its own depth · top-up over existing
 * mulch · depth presets from extension guidance · bags 1–3 ft³ (28–85 L) · ½-yard bulk order ·
 * price · coverage per bag · sticky result · Copy/Share/Print/CSV.
 * Brief: docs/briefs/mulch-calculator.md
 */

const SHAPES: { value: Shape; label: string }[] = [
  { value: 'rectangle', label: 'Bed' },
  { value: 'lshape', label: 'L-shape' },
  { value: 'circle', label: 'Circle' },
  { value: 'ring', label: 'Tree ring' },
  { value: 'triangle', label: 'Corner' },
  { value: 'trapezoid', label: 'Trapezoid' },
  { value: 'area', label: 'Known area' },
];

const SHAPE_NAMES: Record<Shape, string> = {
  rectangle: 'bed',
  lshape: 'L-shape',
  circle: 'circle',
  ring: 'tree ring',
  triangle: 'corner',
  trapezoid: 'trapezoid',
  area: 'known area',
};

let seq = 1;
const newId = () => `m${Date.now().toString(36)}${seq++}`;

const PRICE_UNITS: PriceUnit[] = ['bag', 'yd3', 'ft3', 'm3'];

/* ---------- URL state ---------- */

function encode(input: MulchInput): URLSearchParams {
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
  if (input.existingDepth > 0) p.set('have', compact(input.existingDepth));
  if (input.extraPct > 0) p.set('x', compact(input.extraPct));
  p.set('bag', compact(input.bagSize));
  if (input.price != null && Number.isFinite(input.price)) {
    p.set('p', compact(input.price));
    p.set('pu', input.priceUnit);
  }
  return p;
}

function decode(p: URLSearchParams, defaults: MulchInput): MulchInput {
  if (!p.has('a')) return defaults;
  const n = (v: string | null | undefined, fb: number | undefined) => {
    if (v == null || v === '') return fb;
    const x = Number(v);
    return Number.isFinite(x) ? x : fb;
  };
  const units = p.get('u') === 'met' ? 'metric' : 'imperial';
  const allowed: DepthUnit[] = units === 'metric' ? ['cm', 'm'] : ['in', 'ft'];
  const du = p.get('du') as DepthUnit | null;
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
        { id: newId(), name: decoded.slice(0, 40) || `Bed ${i + 1}`, shape, a: n(a, 10)!, b: n(b, undefined), c: n(c, undefined), d: n(d, undefined), depth: n(depth, 3)!, qty: n(qty, 1)! },
        shape,
      );
    });
  const pu = p.get('pu') as PriceUnit | null;
  return {
    units,
    depthUnit,
    areas: areas.length ? areas : defaults.areas,
    existingDepth: Math.max(0, n(p.get('have'), 0)!),
    extraPct: Math.min(MAX_EXTRA_PCT, Math.max(0, n(p.get('x'), 0)!)),
    bagSize: n(p.get('bag'), units === 'metric' ? 56 : defaults.bagSize)!,
    price: n(p.get('p'), undefined),
    priceUnit: pu && PRICE_UNITS.includes(pu) ? pu : 'bag',
  };
}

/* ---------- component ---------- */

export default function MulchCalculator() {
  const [input, setInput] = useState<MulchInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInput(decode(readParams(), DEFAULT_INPUT));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeParams(encode(input));
  }, [input, hydrated]);

  const result = useMemo(() => calculateMulch(input), [input]);
  const metric = input.units === 'metric';
  const len = metric ? 'm' : 'ft';
  const sq = metric ? 'm²' : 'ft²';
  const du = input.depthUnit;

  const update = (patch: Partial<MulchInput>) => setInput((s) => ({ ...s, ...patch }));
  const updateArea = (id: string, patch: Partial<AreaInput>) => setInput((s) => ({ ...s, areas: s.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  const setShape = (id: string, shape: Shape) => setInput((s) => ({ ...s, areas: s.areas.map((a) => (a.id === id ? withShape(a, shape) : a)) }));
  const addArea = (shape: Shape = 'rectangle') =>
    setInput((s) => {
      const depth = s.areas.at(-1)?.depth ?? (metric ? 7.5 : 3);
      const ring = shape === 'ring';
      const base: AreaInput = ring
        ? { id: newId(), name: `Tree ${s.areas.filter((a) => a.shape === 'ring').length + 1}`, shape: 'ring', a: metric ? 1 : 3, b: metric ? 0.15 : 0.5, depth, qty: 1 }
        : { id: newId(), name: `Bed ${s.areas.length + 1}`, shape: 'rectangle', a: metric ? 3 : 10, b: metric ? 1 : 3, depth, qty: 1 };
      return { ...s, areas: [...s.areas, base] };
    });
  const removeArea = (id: string) => setInput((s) => ({ ...s, areas: s.areas.length > 1 ? s.areas.filter((a) => a.id !== id) : s.areas }));

  /** Depth preset applies to every bed — the usual case is one mulch for the whole yard. */
  const applyPreset = (inches: number) =>
    setInput((s) => ({ ...s, areas: s.areas.map((a) => ({ ...a, depth: Number(convertDepth(inches, 'in', s.depthUnit).toFixed(2)) })) }));
  const presetInches = (() => {
    const ds = input.areas.map((a) => Math.round(convertDepth(a.depth, du, 'in') * 100) / 100);
    return ds.every((d) => d === ds[0]) ? ds[0] : NaN;
  })();
  const activePreset = DEPTH_PRESETS_IN.find((p) => p.in === presetInches)?.id ?? 'custom';

  const setDepthUnit = (to: DepthUnit) => {
    if (to === input.depthUnit) return;
    const c = (v: number) => Number(convertDepth(v, input.depthUnit, to).toFixed(3));
    setInput((s) => ({ ...s, depthUnit: to, existingDepth: c(s.existingDepth), areas: s.areas.map((a) => ({ ...a, depth: c(a.depth) })) }));
  };

  const switchUnits = (units: MulchInput['units']) => {
    if (units === input.units) return;
    const k = units === 'metric' ? M_PER_FT : FT_PER_M;
    const r = (v: number | undefined, d = 3) => (v != null && Number.isFinite(v) ? Number(v.toFixed(d)) : v);
    const toDepth: DepthUnit = units === 'metric' ? (input.depthUnit === 'ft' ? 'm' : 'cm') : input.depthUnit === 'm' ? 'ft' : 'in';
    setInput((s) => ({
      ...s,
      units,
      depthUnit: toDepth,
      existingDepth: r(convertDepth(s.existingDepth, s.depthUnit, toDepth), 2)!,
      areas: s.areas.map((a) => ({
        ...a,
        a: a.shape === 'area' ? r(a.a * k * k, 2)! : r(a.a * k)!,
        b: r(a.b != null ? a.b * k : undefined),
        c: r(a.c != null ? a.c * k : undefined),
        d: r(a.d != null ? a.d * k : undefined),
        depth: r(convertDepth(a.depth, s.depthUnit, toDepth), 2)!,
      })),
      bagSize: units === 'metric' ? 56 : 2,
      priceUnit: units === 'metric' && (s.priceUnit === 'yd3' || s.priceUnit === 'ft3') ? 'm3' : units === 'imperial' && s.priceUnit === 'm3' ? 'yd3' : s.priceUnit,
      price: s.priceUnit === 'bag' ? s.price : undefined,
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
  const bagOptions = (metric ? BAG_SIZES_L : BAG_SIZES_FT3).map((v) => ({ value: String(v), label: metric ? `${v} L` : `${v} ft³` }));
  const priceOptions: { value: PriceUnit; label: string }[] = metric
    ? [
        { value: 'bag', label: 'per bag' },
        { value: 'm3', label: 'per m³' },
      ]
    : [
        { value: 'bag', label: 'per bag' },
        { value: 'yd3', label: 'per yd³' },
      ];

  const bagFt3 = metric ? input.bagSize / L_PER_FT3 : input.bagSize;
  const bagLabel = metric ? `${fmt(input.bagSize, 0)} L` : `${fmt(input.bagSize, 2)} ft³`;
  const primary = `${result.bags} bags`;
  const volumeText = metric ? `${fmt(result.orderM3, 2, true)} m³` : `${fmt(result.orderYd3, 2, true)} yd³`;

  const summary = [
    `Mulch: ${result.bags} bags of ${bagLabel}, or ${fmt(result.orderYd3, 2)} yd³ (${fmt(result.orderFt3, 1)} ft³, ${fmt(result.orderM3, 2)} m³) in bulk`,
    input.existingDepth > 0 ? `Top-up over ${fmt(input.existingDepth, 2)} ${du} already in place` : '',
    ...result.areas.filter((a) => !a.error).map((a) => `  ${a.name}: ${fmt(a.areaFt2 * a.qty, 1)} ft², ${fmt(a.volumeFt3, 2)} ft³`),
    `Bulk order: ${fmt(result.suggestedYd3, 1)} yd³`,
    result.cost != null ? `Cost: ${fmtMoney(result.cost)}` : '',
    typeof window !== 'undefined' ? shareUrl(encode(input)) : '',
  ]
    .filter(Boolean)
    .join('\n');

  const csvRows: (string | number)[][] = [
    ['Bed', 'Shape', 'Qty', 'Area (ft²)', `Depth added (${du})`, 'Volume (ft³)', 'Volume (yd³)'],
    ...result.areas
      .filter((a) => !a.error)
      .map((a, i) => [a.name, SHAPE_NAMES[a.shape], a.qty, fmt(a.areaFt2 * a.qty, 2), fmt(result.addedDepths[input.areas.findIndex((x) => x.id === a.id)] ?? 0, 2), fmt(a.volumeFt3, 2), fmt(a.volumeFt3 / 27, 3)]),
    ['Total', '', '', fmt(result.areaFt2, 2), '', fmt(result.volumeFt3, 2), fmt(result.volumeYd3, 3)],
    ...(input.extraPct > 0 ? [[`With ${fmt(input.extraPct, 0)}% extra`, '', '', '', '', fmt(result.orderFt3, 2), fmt(result.orderYd3, 3)]] : []),
    [`Bags (${bagLabel})`, '', result.bags, '', '', '', ''],
    ['Bulk order (yd³)', '', '', '', '', '', fmt(result.suggestedYd3, 1)],
    ...(result.cost != null ? [['Cost (USD)', '', '', '', '', '', result.cost.toFixed(2)]] : []),
  ];

  return (
    <div class="grid gap-5 md:gap-6 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] md:items-start">
      <form class="grid gap-4 min-w-0 grid-cols-[minmax(0,1fr)]" onSubmit={(e) => e.preventDefault()} aria-label="Mulch inputs">
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0">
          <span class="rule-label shrink-0 after:hidden">Beds &amp; tree rings</span>
          <div class="flex items-center gap-2">
            <Segmented label="Depth unit" hideLabel size="sm" value={du} onChange={setDepthUnit} options={depthOptions} />
            <UnitToggle value={input.units} onChange={switchUnits} />
          </div>
        </div>

        {input.areas.map((area, i) => {
          const res = result.areas.find((r) => r.id === area.id);
          const err = (v: number | undefined) => (res?.error && !(v != null && v >= 0) ? 'Enter 0 or more' : undefined);
          const added = result.addedDepths[i];
          return (
            <fieldset key={area.id} class="rounded-card border border-border bg-surface-sunken p-3.5 grid gap-3.5 min-w-0">
              <legend class="px-2 ml-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted bg-surface border border-border rounded-full py-0.5">
                {area.shape === 'ring' ? 'Tree ring' : 'Bed'} {i + 1}
              </legend>

              <div class="flex items-center gap-2 min-w-0">
                <div class="relative flex-1 min-w-0">
                  <label for={`${area.id}-name`} class="sr-only">
                    Bed name
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
                    placeholder="Bed name"
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
                    aria-label={`Remove ${area.name || `bed ${i + 1}`}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div class="order-last sm:order-none">
                <ShapePicker label={`Shape of ${area.name || `bed ${i + 1}`}`} hideLabel value={area.shape} options={SHAPES} onChange={(shape) => setShape(area.id, shape)} />
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
                {area.shape === 'circle' && <NumberInput label="Diameter" unit={len} feet={!metric} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={err(area.a)} />}
                {area.shape === 'ring' && (
                  <>
                    <NumberInput
                      label="Ring diameter"
                      hint={metric ? 'At least 1 m across' : 'At least 3 ft across'}
                      unit={len}
                      feet={!metric}
                      value={area.a}
                      onChange={(a) => updateArea(area.id, { a })}
                      error={res?.error && /smaller/.test(res.error) ? undefined : err(area.a)}
                    />
                    <NumberInput
                      label="Bare circle at the trunk"
                      hint={metric ? 'Trunk + 10 cm each side' : `Trunk + 4" each side`}
                      unit={len}
                      feet={!metric}
                      value={area.b ?? NaN}
                      onChange={(b) => updateArea(area.id, { b })}
                      error={res?.error && /smaller/.test(res.error) ? 'Must be smaller than the ring' : err(area.b)}
                    />
                  </>
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
                <NumberInput label="Mulch depth" unit={du} value={area.depth} onChange={(depth) => updateArea(area.id, { depth })} error={res?.error && !(area.depth >= 0) ? 'Enter 0 or more' : undefined} />
                <NumberInput label={area.shape === 'ring' ? 'Identical trees' : 'Identical beds'} integer min={1} max={MAX_QTY} steppers value={area.qty} onChange={(qty) => updateArea(area.id, { qty })} />
              </div>

              {res && !res.error && (
                <p class="figure m-0 text-[0.6875rem] font-mono text-muted">
                  {fmt(res.areaFt2 * res.qty, 1)} ft² · {metric ? `${fmt(ft3ToM3(res.volumeFt3), 3)} m³` : `${fmt(res.volumeFt3, 2)} ft³`}
                  {input.existingDepth > 0 ? ` · adding ${fmt(added, 2)} ${du}` : ''}
                </p>
              )}
            </fieldset>
          );
        })}

        <div class="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[2fr_1fr] gap-2">
          <button
            type="button"
            onClick={() => addArea('rectangle')}
            class="min-h-12 rounded-field border border-dashed border-accent-line text-accent text-[0.9375rem] font-semibold hover:bg-accent-soft hover:border-accent transition-colors"
          >
            + Add another bed
          </button>
          <button
            type="button"
            onClick={() => addArea('ring')}
            class="min-h-12 rounded-field border border-dashed border-accent-line text-accent text-[0.875rem] font-semibold hover:bg-accent-soft hover:border-accent transition-colors"
          >
            + Add a tree ring
          </button>
        </div>

        <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] items-end">
          <Segmented
            label="Depth for all beds"
            value={activePreset}
            onChange={(id) => {
              const p = DEPTH_PRESETS_IN.find((x) => x.id === id);
              if (p) applyPreset(p.in);
            }}
            options={[
              ...DEPTH_PRESETS_IN.map((p) => ({ value: p.id, label: metric ? `${p.label.split(' ')[0]} ${Math.round(p.in * 2.54)} cm` : p.label })),
              ...(activePreset === 'custom' ? [{ value: 'custom' as const, label: 'Custom' }] : []),
            ]}
          />
          <NumberInput
            label="Mulch already there"
            unit={du}
            value={input.existingDepth}
            onChange={(v) => update({ existingDepth: Number.isFinite(v) && v > 0 ? v : 0 })}
            hint="Old mulch breaks down; only the difference is ordered"
          />
        </div>

        <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] items-end">
          <Segmented label={metric ? 'Bag size' : 'Bag size'} value={String(input.bagSize)} onChange={(v) => update({ bagSize: Number(v) })} options={bagOptions} />
          <NumberInput label="Extra" unit="%" integer min={0} max={MAX_EXTRA_PCT} steppers value={input.extraPct} onChange={(extraPct) => update({ extraPct })} hint="Optional; bags are already rounded up" />
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
            <NumberInput label="Price" unit="$" value={input.price ?? NaN} onChange={(v) => update({ price: Number.isFinite(v) ? v : undefined })} hint="Bag price, or bulk price per yard" />
            <Segmented label="Price is" value={input.priceUnit} onChange={(priceUnit) => update({ priceUnit })} options={priceOptions} />
          </div>
        </details>
      </form>

      <div class="grid gap-3 md:sticky md:top-28">
        <ResultCard
          id="mulch-result"
          primaryLabel={`Bags of ${bagLabel} to buy`}
          primary={primary}
          secondary={[
            { label: 'Or in bulk', value: volumeText },
            { label: 'Bulk order', value: result.suggestedYd3 > 0 ? `${fmt(result.suggestedYd3, 1)} yd³` : '—', hint: 'Rounded up to the next ½ yard' },
            { label: 'Cubic feet', value: `${fmt(result.orderFt3, 1)} ft³` },
            { label: 'Area covered', value: metric ? `${fmt(result.areaFt2 * M_PER_FT * M_PER_FT, 1)} m²` : `${fmt(result.areaFt2, 0)} ft²` },
            ...(result.cost != null ? [{ label: 'Estimated cost', value: fmtMoney(result.cost) }] : []),
          ]}
          note={
            <>
              {input.existingDepth > 0 ? `Topping up over ${fmt(input.existingDepth, 2)} ${du} of old mulch. ` : ''}Keep mulch a few inches back from trunks and stems.
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
              <ShareButton url={hydrated ? shareUrl(encode(input)) : ''} title="Mulch calculator result" />
              <PrintButton />
              <CsvButton filename="mulch" rows={csvRows} />
            </>
          }
        />

        <ResultTable
          caption={`What one ${bagLabel} bag covers`}
          columns={['Depth', 'One bag covers', metric ? 'One m³ covers' : 'One yd³ covers']}
          rows={[2, 3, 4].map((d) => [
            metric ? `${Math.round(d * 2.54)} cm` : `${d} in`,
            metric ? `${fmt(bagCoverageFt2(bagFt3, d) * M_PER_FT * M_PER_FT, 2)} m²` : `${fmt(bagCoverageFt2(bagFt3, d), 1)} ft²`,
            metric ? `${fmt(1 / ((d * 2.54) / 100), 1)} m²` : `${fmt(bagCoverageFt2(27, d), 0)} ft²`,
          ])}
          compact
        />
      </div>

      <StickyResult watchId="mulch-result" label="Bags to buy" value={primary} secondary={volumeText} />
    </div>
  );
}
