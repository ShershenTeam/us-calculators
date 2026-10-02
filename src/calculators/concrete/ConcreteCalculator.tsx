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
import { fmt, fmtInt, fmtMoney } from '@/lib/format';
import { readParams, writeParams, shareUrl, compact } from '@/lib/url-state';
import { withShape, convertDepth, SHAPE_CODES, CODE_SHAPES, M_PER_FT, FT_PER_M, CM_PER_IN } from '@/lib/area';
import {
  calculateConcrete,
  bagById,
  BAGS,
  DEFAULT_INPUT,
  DEFAULT_STAIRS_IMPERIAL,
  DEFAULT_STAIRS_METRIC,
  DENSITY_LB_FT3,
  MAX_EXTRA_PCT,
  MAX_QTY,
  MAX_RISERS,
  ft3ToM3,
  bagsPerYd3,
  LB_PER_KG,
} from './logic';
import type { BagId, ConcreteInput, DepthUnit, ElementInput, ElementKind, PriceUnit, Shape, StairsDims } from './types';

/**
 * Concrete calculator island. Server-rendered with the default example, hydrated on load.
 * Named pours — slab, footing, wall, column / post hole of any plane shape, or a flight of stairs —
 * summed · quantity · in/ft or cm/m · extra % · bags of 40–90 lb from the manufacturer's yields ·
 * bag weight · price per bag / yd³ · "How it's calculated" · sticky result · Copy/Share/Print/CSV.
 * Brief: docs/briefs/concrete-calculator.md
 */

const SHAPES: { value: Shape; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'lshape', label: 'L-shape' },
  { value: 'circle', label: 'Column / hole' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'trapezoid', label: 'Trapezoid' },
  { value: 'area', label: 'Known area' },
];

const KINDS: { value: ElementKind; label: string }[] = [
  { value: 'shape', label: 'Slab, footing or column' },
  { value: 'stairs', label: 'Stairs' },
];

const SHAPE_NAMES: Record<Shape, string> = {
  rectangle: 'rectangle',
  lshape: 'L-shape',
  circle: 'column / hole',
  triangle: 'triangle',
  trapezoid: 'trapezoid',
  area: 'known area',
};

let seq = 1;
const newId = () => `e${Date.now().toString(36)}${seq++}`;

const BAG_IDS = BAGS.map((b) => b.id);
const PRICE_UNITS: PriceUnit[] = ['bag', 'yd3', 'm3'];

/* ---------- URL state ---------- */

function encode(input: ConcreteInput): URLSearchParams {
  const p = new URLSearchParams();
  p.set('u', input.units === 'metric' ? 'met' : 'imp');
  p.set('du', input.depthUnit);
  p.set(
    'e',
    input.elements
      .map((e) => {
        const name = encodeURIComponent(e.name.slice(0, 40));
        const qty = e.qty > 1 ? String(e.qty) : '';
        if (e.kind === 'stairs' && e.stairs) {
          const s = e.stairs;
          return ['st', compact(s.risers), compact(s.rise), compact(s.run), compact(s.width), compact(s.platform), qty, name].join(':');
        }
        return [
          SHAPE_CODES[e.shape],
          compact(e.a),
          e.b != null ? compact(e.b) : '',
          e.c != null ? compact(e.c) : '',
          e.d != null ? compact(e.d) : '',
          compact(e.thickness),
          qty,
          name,
        ].join(':');
      })
      .join(';'),
  );
  p.set('x', compact(input.extraPct));
  p.set('bag', input.bag);
  if (input.price != null && Number.isFinite(input.price)) {
    p.set('p', compact(input.price));
    p.set('pu', input.priceUnit);
  }
  return p;
}

function decode(p: URLSearchParams, defaults: ConcreteInput): ConcreteInput {
  if (!p.has('e')) return defaults;
  const n = (v: string | null | undefined, fb: number | undefined) => {
    if (v == null || v === '') return fb;
    const x = Number(v);
    return Number.isFinite(x) ? x : fb;
  };
  const units = p.get('u') === 'met' ? 'metric' : 'imperial';
  const allowed: DepthUnit[] = units === 'metric' ? ['cm', 'm'] : ['in', 'ft'];
  const du = p.get('du') as DepthUnit | null;
  const depthUnit = du && allowed.includes(du) ? du : allowed[0];
  const stairsDefault = units === 'metric' ? DEFAULT_STAIRS_METRIC : DEFAULT_STAIRS_IMPERIAL;
  const elements: ElementInput[] = (p.get('e') ?? '')
    .split(';')
    .filter(Boolean)
    .slice(0, 50)
    .map((chunk, i) => {
      const parts = chunk.split(':');
      let name = '';
      try {
        name = decodeURIComponent(parts[7] ?? '');
      } catch {
        name = '';
      }
      name = name.slice(0, 40) || `Pour ${i + 1}`;
      const qty = n(parts[6], 1)!;
      if (parts[0] === 'st') {
        const stairs: StairsDims = {
          risers: n(parts[1], stairsDefault.risers)!,
          rise: n(parts[2], stairsDefault.rise)!,
          run: n(parts[3], stairsDefault.run)!,
          width: n(parts[4], stairsDefault.width)!,
          platform: n(parts[5], stairsDefault.platform)!,
        };
        return { id: newId(), name, kind: 'stairs', shape: 'rectangle', a: 0, thickness: 0, qty, stairs };
      }
      const shape = CODE_SHAPES[parts[0] ?? ''] ?? 'rectangle';
      return withShape<ElementInput>(
        { id: newId(), name, kind: 'shape', shape, a: n(parts[1], 10)!, b: n(parts[2], undefined), c: n(parts[3], undefined), d: n(parts[4], undefined), thickness: n(parts[5], 4)!, qty },
        shape,
      );
    });
  const bag = p.get('bag') as BagId | null;
  const pu = p.get('pu') as PriceUnit | null;
  return {
    units,
    depthUnit,
    elements: elements.length ? elements : defaults.elements,
    extraPct: Math.min(MAX_EXTRA_PCT, Math.max(0, n(p.get('x'), defaults.extraPct)!)),
    bag: bag && BAG_IDS.includes(bag) ? bag : defaults.bag,
    price: n(p.get('p'), undefined),
    priceUnit: pu && PRICE_UNITS.includes(pu) ? pu : 'bag',
  };
}

/* ---------- component ---------- */

export default function ConcreteCalculator() {
  const [input, setInput] = useState<ConcreteInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInput(decode(readParams(), DEFAULT_INPUT));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeParams(encode(input));
  }, [input, hydrated]);

  const result = useMemo(() => calculateConcrete(input), [input]);
  const metric = input.units === 'metric';
  const len = metric ? 'm' : 'ft';
  const small = metric ? 'cm' : 'in';
  const sq = metric ? 'm²' : 'ft²';
  const du = input.depthUnit;
  const bag = bagById(input.bag);
  const bagName = metric ? `${fmt(bag.lb / LB_PER_KG, 1)} kg` : `${bag.lb} lb`;

  const update = (patch: Partial<ConcreteInput>) => setInput((s) => ({ ...s, ...patch }));
  const updateEl = (id: string, patch: Partial<ElementInput>) =>
    setInput((s) => ({ ...s, elements: s.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
  const updateStairs = (id: string, patch: Partial<StairsDims>) =>
    setInput((s) => ({
      ...s,
      elements: s.elements.map((e) => (e.id === id ? { ...e, stairs: { ...(e.stairs ?? (metric ? DEFAULT_STAIRS_METRIC : DEFAULT_STAIRS_IMPERIAL)), ...patch } } : e)),
    }));
  const setShape = (id: string, shape: Shape) => setInput((s) => ({ ...s, elements: s.elements.map((e) => (e.id === id ? withShape(e, shape) : e)) }));
  const setKind = (id: string, kind: ElementKind) =>
    setInput((s) => ({
      ...s,
      elements: s.elements.map((e) =>
        e.id === id ? { ...e, kind, stairs: kind === 'stairs' ? (e.stairs ?? (metric ? DEFAULT_STAIRS_METRIC : DEFAULT_STAIRS_IMPERIAL)) : e.stairs } : e,
      ),
    }));
  const addEl = () =>
    setInput((s) => ({
      ...s,
      elements: [
        ...s.elements,
        { id: newId(), name: `Pour ${s.elements.length + 1}`, kind: 'shape', shape: 'rectangle', a: metric ? 3 : 10, b: metric ? 3 : 10, thickness: s.elements.at(-1)?.thickness ?? (metric ? 10 : 4), qty: 1 },
      ],
    }));
  const removeEl = (id: string) => setInput((s) => ({ ...s, elements: s.elements.length > 1 ? s.elements.filter((e) => e.id !== id) : s.elements }));

  const setDepthUnit = (to: DepthUnit) => {
    if (to === input.depthUnit) return;
    setInput((s) => ({ ...s, depthUnit: to, elements: s.elements.map((e) => ({ ...e, thickness: Number(convertDepth(e.thickness, s.depthUnit, to).toFixed(3)) })) }));
  };

  const switchUnits = (units: ConcreteInput['units']) => {
    if (units === input.units) return;
    const k = units === 'metric' ? M_PER_FT : FT_PER_M;
    const ks = units === 'metric' ? CM_PER_IN : 1 / CM_PER_IN; // in ↔ cm
    const r = (v: number | undefined, d = 3) => (v != null && Number.isFinite(v) ? Number(v.toFixed(d)) : v);
    const toDepth: DepthUnit = units === 'metric' ? (input.depthUnit === 'ft' ? 'm' : 'cm') : input.depthUnit === 'm' ? 'ft' : 'in';
    setInput((s) => ({
      ...s,
      units,
      depthUnit: toDepth,
      elements: s.elements.map((e) => ({
        ...e,
        a: e.shape === 'area' ? r(e.a * k * k, 2)! : r(e.a * k)!,
        b: r(e.b != null ? e.b * k : undefined),
        c: r(e.c != null ? e.c * k : undefined),
        d: r(e.d != null ? e.d * k : undefined),
        thickness: r(convertDepth(e.thickness, s.depthUnit, toDepth), 2)!,
        stairs: e.stairs && {
          risers: e.stairs.risers,
          rise: r(e.stairs.rise * ks, 1)!,
          run: r(e.stairs.run * ks, 1)!,
          platform: r(e.stairs.platform * ks, 1)!,
          width: r(e.stairs.width * k, 2)!,
        },
      })),
      priceUnit: units === 'metric' && s.priceUnit === 'yd3' ? 'm3' : units === 'imperial' && s.priceUnit === 'm3' ? 'yd3' : s.priceUnit,
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
  const bagOptions = BAGS.map((b) => ({ value: b.id, label: metric ? `${fmt(b.lb / LB_PER_KG, 0)} kg` : `${b.lb} lb` }));
  const priceOptions: { value: PriceUnit; label: string }[] = [
    { value: 'bag', label: 'per bag' },
    metric ? { value: 'm3', label: 'per m³' } : { value: 'yd3', label: 'per yd³' },
  ];

  const primary = metric ? `${fmt(result.orderM3, 2, true)} m³` : `${fmt(result.orderYd3, 2, true)} yd³`;
  const weightText = metric ? `${fmtInt(result.bagWeightLb / LB_PER_KG)} kg` : `${fmtInt(result.bagWeightLb)} lb`;

  const summary = [
    `Concrete to order: ${fmt(result.orderYd3, 2)} yd³ (${fmt(result.orderFt3, 1)} ft³, ${fmt(result.orderM3, 2)} m³) incl. ${fmt(input.extraPct, 0)}% extra`,
    ...result.elements.filter((e) => !e.error).map((e) => `  ${e.name}: ${fmt(e.volumeFt3, 2)} ft³`),
    `Bags: ${result.bags} × ${bag.lb} lb (${fmtInt(result.bagWeightLb)} lb to carry)`,
    `Other sizes: ${result.bagTable.map((b) => `${b.bags} × ${b.lb} lb`).join(', ')}`,
    result.cost != null ? `Cost: ${fmtMoney(result.cost)}` : '',
    typeof window !== 'undefined' ? shareUrl(encode(input)) : '',
  ]
    .filter(Boolean)
    .join('\n');

  const csvRows: (string | number)[][] = [
    ['Pour', 'Type', 'Qty', 'Volume (ft³)', 'Volume (yd³)', 'Volume (m³)'],
    ...result.elements
      .filter((e) => !e.error)
      .map((e) => [e.name, e.kind === 'stairs' ? 'stairs' : SHAPE_NAMES[e.shape], e.qty, fmt(e.volumeFt3, 2), fmt(e.volumeFt3 / 27, 3), fmt(ft3ToM3(e.volumeFt3), 3)]),
    ['Total', '', '', fmt(result.volumeFt3, 2), fmt(result.volumeYd3, 3), fmt(result.volumeM3, 3)],
    [`With ${fmt(input.extraPct, 0)}% extra`, '', '', fmt(result.orderFt3, 2), fmt(result.orderYd3, 3), fmt(result.orderM3, 3)],
    ...result.bagTable.map((b) => [`${b.lb} lb bags (${b.yieldFt3} ft³ each)`, '', b.bags, '', '', '']),
    ...(result.cost != null ? [['Cost (USD)', '', '', result.cost.toFixed(2), '', '']] : []),
  ];

  return (
    <div class="grid gap-5 md:gap-6 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] md:items-start">
      <form class="grid gap-4 min-w-0 grid-cols-[minmax(0,1fr)]" onSubmit={(e) => e.preventDefault()} aria-label="Concrete inputs">
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0">
          <span class="rule-label shrink-0 after:hidden">What you are pouring</span>
          <div class="flex items-center gap-2">
            <Segmented label="Thickness unit" hideLabel size="sm" value={du} onChange={setDepthUnit} options={depthOptions} />
            <UnitToggle value={input.units} onChange={switchUnits} />
          </div>
        </div>

        {input.elements.map((el, i) => {
          const res = result.elements.find((r) => r.id === el.id);
          const err = (v: number | undefined) => (res?.error && !(v != null && v >= 0) ? 'Enter 0 or more' : undefined);
          const stairs = el.kind === 'stairs';
          const s = el.stairs ?? (metric ? DEFAULT_STAIRS_METRIC : DEFAULT_STAIRS_IMPERIAL);
          const column = el.shape === 'circle';
          return (
            <fieldset key={el.id} class="rounded-card border border-border bg-surface-sunken p-3.5 grid gap-3.5 min-w-0">
              <legend class="px-2 ml-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted bg-surface border border-border rounded-full py-0.5">
                Pour {i + 1}
              </legend>

              <div class="flex items-center gap-2 min-w-0">
                <div class="relative flex-1 min-w-0">
                  <label for={`${el.id}-name`} class="sr-only">
                    Pour name
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
                    id={`${el.id}-name`}
                    type="text"
                    data-kind="label"
                    enterKeyHint="next"
                    maxLength={40}
                    autoComplete="off"
                    placeholder="Pour name"
                    value={el.name}
                    onInput={(e) => updateEl(el.id, { name: e.currentTarget.value })}
                    class="w-full h-11 pl-9 pr-3 rounded-field border border-transparent bg-transparent text-text text-base font-semibold outline-none transition-colors hover:border-border focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/15"
                  />
                </div>
                {input.elements.length > 1 && (
                  <button
                    type="button"
                    class="min-h-12 px-2 text-[0.8125rem] font-medium text-muted hover:text-error transition-colors"
                    onClick={() => removeEl(el.id)}
                    aria-label={`Remove ${el.name || `pour ${i + 1}`}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div class="order-last sm:order-none grid gap-2.5">
                <Segmented label={`Type of ${el.name || `pour ${i + 1}`}`} hideLabel size="sm" value={el.kind} onChange={(k) => setKind(el.id, k)} options={KINDS} />
                {!stairs && <ShapePicker label={`Shape of ${el.name || `pour ${i + 1}`}`} hideLabel value={el.shape} options={SHAPES} onChange={(shape) => setShape(el.id, shape)} />}
              </div>

              {stairs ? (
                <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))] items-end">
                  <NumberInput label="Number of risers" integer min={1} max={MAX_RISERS} steppers value={s.risers} onChange={(risers) => updateStairs(el.id, { risers })} />
                  <NumberInput label="Riser height" hint={metric ? 'Usually 15–19 cm' : 'Usually 6–7¾ in'} unit={small} value={s.rise} onChange={(rise) => updateStairs(el.id, { rise })} error={err(s.rise)} />
                  <NumberInput label="Tread depth" hint={metric ? 'Usually 25–30 cm' : 'Usually 10–12 in'} unit={small} value={s.run} onChange={(run) => updateStairs(el.id, { run })} error={err(s.run)} />
                  <NumberInput label="Width" unit={len} feet={!metric} value={s.width} onChange={(width) => updateStairs(el.id, { width })} error={err(s.width)} />
                  <NumberInput label="Top landing depth" hint="0 if there is none" unit={small} value={s.platform} onChange={(platform) => updateStairs(el.id, { platform })} error={err(s.platform)} />
                  <NumberInput label="Identical flights" integer min={1} max={MAX_QTY} steppers value={el.qty} onChange={(qty) => updateEl(el.id, { qty })} />
                </div>
              ) : (
                <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))] items-end">
                  {el.shape === 'rectangle' && (
                    <>
                      <NumberInput label="Length" unit={len} feet={!metric} value={el.a} onChange={(a) => updateEl(el.id, { a })} error={err(el.a)} />
                      <NumberInput label="Width" unit={len} feet={!metric} value={el.b ?? NaN} onChange={(b) => updateEl(el.id, { b })} error={err(el.b)} />
                    </>
                  )}
                  {el.shape === 'lshape' && (
                    <>
                      <NumberInput label="Part 1 length" unit={len} feet={!metric} value={el.a} onChange={(a) => updateEl(el.id, { a })} error={err(el.a)} />
                      <NumberInput label="Part 1 width" unit={len} feet={!metric} value={el.b ?? NaN} onChange={(b) => updateEl(el.id, { b })} error={err(el.b)} />
                      <NumberInput label="Part 2 length" unit={len} feet={!metric} value={el.c ?? NaN} onChange={(c) => updateEl(el.id, { c })} error={err(el.c)} />
                      <NumberInput label="Part 2 width" unit={len} feet={!metric} value={el.d ?? NaN} onChange={(d) => updateEl(el.id, { d })} error={err(el.d)} />
                    </>
                  )}
                  {el.shape === 'circle' && (
                    <NumberInput label="Diameter" hint={metric ? undefined : `Type 12" for inches`} unit={len} feet={!metric} value={el.a} onChange={(a) => updateEl(el.id, { a })} error={err(el.a)} />
                  )}
                  {el.shape === 'triangle' && (
                    <>
                      <NumberInput label="Base" unit={len} feet={!metric} value={el.a} onChange={(a) => updateEl(el.id, { a })} error={err(el.a)} />
                      <NumberInput label="Height" unit={len} feet={!metric} value={el.b ?? NaN} onChange={(b) => updateEl(el.id, { b })} error={err(el.b)} />
                    </>
                  )}
                  {el.shape === 'trapezoid' && (
                    <>
                      <NumberInput label="Side a" hint="One parallel side" unit={len} feet={!metric} value={el.a} onChange={(a) => updateEl(el.id, { a })} error={err(el.a)} />
                      <NumberInput label="Side b" hint="The other parallel side" unit={len} feet={!metric} value={el.b ?? NaN} onChange={(b) => updateEl(el.id, { b })} error={err(el.b)} />
                      <NumberInput label="Width" hint="Distance between them" unit={len} feet={!metric} value={el.c ?? NaN} onChange={(c) => updateEl(el.id, { c })} error={err(el.c)} />
                    </>
                  )}
                  {el.shape === 'area' && <NumberInput label="Area" unit={sq} value={el.a} onChange={(a) => updateEl(el.id, { a })} error={err(el.a)} />}
                  <NumberInput
                    label={column ? 'Depth / height' : 'Thickness'}
                    unit={du}
                    value={el.thickness}
                    onChange={(thickness) => updateEl(el.id, { thickness })}
                    error={res?.error && !(el.thickness >= 0) ? 'Enter 0 or more' : undefined}
                    hint={i === 0 && !column ? (metric ? 'Patios, walks 10 cm; driveways 10–15 cm' : 'Patios, walks 4 in; driveways 4–6 in') : undefined}
                  />
                  <NumberInput
                    label={column ? 'How many' : 'Identical pours'}
                    integer
                    min={1}
                    max={MAX_QTY}
                    steppers
                    value={el.qty}
                    onChange={(qty) => updateEl(el.id, { qty })}
                  />
                </div>
              )}

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
          onClick={addEl}
          class="min-h-12 rounded-field border border-dashed border-accent-line text-accent text-[0.9375rem] font-semibold hover:bg-accent-soft hover:border-accent transition-colors"
        >
          + Add another pour
        </button>

        <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] items-end">
          <Segmented label="Bag size" value={input.bag} onChange={(b) => update({ bag: b })} options={bagOptions} />
          <NumberInput
            label="Extra so you do not run short"
            unit="%"
            integer
            min={0}
            max={MAX_EXTRA_PCT}
            steppers
            value={input.extraPct}
            onChange={(extraPct) => update({ extraPct })}
            hint="5 % is a sound margin; more over uneven ground"
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
            <NumberInput label="Price" unit="$" value={input.price ?? NaN} onChange={(v) => update({ price: Number.isFinite(v) ? v : undefined })} hint="Bag price or ready-mix price per yard" />
            <Segmented label="Price is" value={input.priceUnit} onChange={(priceUnit) => update({ priceUnit })} options={priceOptions} />
          </div>
        </details>
      </form>

      <div class="grid gap-3 md:sticky md:top-28">
        <ResultCard
          id="concrete-result"
          primaryLabel={`Concrete to order (incl. ${fmt(input.extraPct, 0)}% extra)`}
          primary={primary}
          secondary={[
            { label: `Bags (${bagName})`, value: `${result.bags}` },
            metric ? { label: 'Cubic yards', value: `${fmt(result.orderYd3, 2)} yd³` } : { label: 'Cubic meters', value: `${fmt(result.orderM3, 2)} m³` },
            { label: 'Cubic feet', value: `${fmt(result.orderFt3, 1)} ft³` },
            { label: 'Bags weigh', value: weightText, hint: 'What you will carry' },
            { label: 'Without extra', value: metric ? `${fmt(result.volumeM3, 2)} m³` : `${fmt(result.volumeYd3, 2)} yd³` },
            ...(result.cost != null ? [{ label: 'Estimated cost', value: fmtMoney(result.cost) }] : []),
          ]}
          note={
            <>
              Bag yields from the QUIKRETE Concrete Mix data sheet ({bag.lb} lb = {fmt(bag.yieldFt3, 3)} ft³). In place the concrete weighs about {fmtInt(result.concreteWeightLb)} lb ({DENSITY_LB_FT3} lb/ft³).
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
              <ShareButton url={hydrated ? shareUrl(encode(input)) : ''} title="Concrete calculator result" />
              <PrintButton />
              <CsvButton filename="concrete-estimate" rows={csvRows} />
            </>
          }
        />

        <ResultTable
          caption="Bags for this pour, by size"
          columns={['Bag', 'Bags', metric ? 'Per m³' : 'Per yd³']}
          rows={result.bagTable.map((b) => [
            metric ? `${fmt(b.lb / LB_PER_KG, 1)} kg` : `${b.lb} lb`,
            `${b.bags}`,
            metric ? fmt(1 / ft3ToM3(b.yieldFt3), 0) : fmt(bagsPerYd3(b.yieldFt3), 0),
          ])}
          compact
        />
      </div>

      <StickyResult watchId="concrete-result" label="Concrete to order" value={primary} secondary={`${result.bags} × ${bagName}`} />
    </div>
  );
}
