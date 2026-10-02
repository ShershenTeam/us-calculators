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
import { withShape, SHAPE_CODES, CODE_SHAPES } from '@/lib/area';
import {
  calculateSquareFootage,
  DEFAULT_INPUT,
  WASTE_PRESETS,
  MAX_WASTE_PCT,
  FT_PER_M,
  M_PER_FT,
  ft2ToM2,
} from './logic';
import type { PriceUnit, RoomInput, Shape, SquareFootageInput } from './types';

/**
 * Square footage calculator island. Server-rendered with the default example, hydrated on load.
 * Named rooms of any shape · cut-outs · quantity · imperial/metric · waste presets ·
 * boxes · price · room schedule · "How it's calculated" · sticky result · Copy/Share/Print/CSV.
 * Brief: docs/briefs/square-footage-calculator.md
 */

const SHAPES: { value: Shape; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'lshape', label: 'L-shape' },
  { value: 'circle', label: 'Circle' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'trapezoid', label: 'Trapezoid' },
  { value: 'area', label: 'Known area' },
];

const SHAPE_NAMES: Record<Shape, string> = {
  rectangle: 'rectangle',
  lshape: 'L-shape',
  circle: 'circle',
  ring: 'ring',
  triangle: 'triangle',
  trapezoid: 'trapezoid',
  area: 'known area',
};

let seq = 1;
const newId = () => `r${Date.now().toString(36)}${seq++}`;

/* ---------- URL state ---------- */


function encode(input: SquareFootageInput): URLSearchParams {
  const p = new URLSearchParams();
  p.set('u', input.units === 'metric' ? 'met' : 'imp');
  p.set(
    'r',
    input.rooms
      .map((r) =>
        [
          SHAPE_CODES[r.shape],
          compact(r.a),
          r.b != null ? compact(r.b) : '',
          r.c != null ? compact(r.c) : '',
          r.d != null ? compact(r.d) : '',
          r.qty > 1 ? String(r.qty) : '',
          r.subtract ? '1' : '',
          encodeURIComponent(r.name.slice(0, 40)),
        ].join(':'),
      )
      .join(';'),
  );
  p.set('w', compact(input.wastePct));
  if (input.boxCoverage != null && Number.isFinite(input.boxCoverage)) p.set('box', compact(input.boxCoverage));
  if (input.price != null && Number.isFinite(input.price)) {
    p.set('p', compact(input.price));
    p.set('pu', input.priceUnit);
  }
  return p;
}

function decode(p: URLSearchParams, defaults: SquareFootageInput): SquareFootageInput {
  if (!p.has('r')) return defaults;
  const n = (v: string | undefined, fb: number | undefined) => {
    if (v == null || v === '') return fb;
    const x = Number(v);
    return Number.isFinite(x) ? x : fb;
  };
  const rooms: RoomInput[] = (p.get('r') ?? '')
    .split(';')
    .filter(Boolean)
    .slice(0, 50)
    .map((chunk, i) => {
      const [code, a, b, c, d, qty, sub, name] = chunk.split(':');
      const shape = CODE_SHAPES[code ?? ''] ?? 'rectangle';
      let decoded = '';
      try {
        decoded = decodeURIComponent(name ?? '');
      } catch {
        decoded = '';
      }
      return withShape(
        {
          id: newId(),
          name: decoded.slice(0, 40) || `Room ${i + 1}`,
          shape,
          a: n(a, 10)!,
          b: n(b, undefined),
          c: n(c, undefined),
          d: n(d, undefined),
          qty: n(qty, 1)!,
          subtract: sub === '1',
        },
        shape,
      );
    });
  const price = n(p.get('p') ?? undefined, undefined);
  const pu = p.get('pu');
  return {
    units: p.get('u') === 'met' ? 'metric' : 'imperial',
    rooms: rooms.length ? rooms : defaults.rooms,
    wastePct: Math.min(MAX_WASTE_PCT, Math.max(0, n(p.get('w') ?? undefined, defaults.wastePct)!)),
    boxCoverage: n(p.get('box') ?? undefined, undefined),
    price,
    priceUnit: (pu === 'yd2' || pu === 'm2' ? pu : 'ft2') as PriceUnit,
  };
}

/* ---------- component ---------- */

export default function SquareFootageCalculator() {
  const [input, setInput] = useState<SquareFootageInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  // Restore shared state after hydration (SSR renders the default example).
  useEffect(() => {
    setInput(decode(readParams(), DEFAULT_INPUT));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeParams(encode(input));
  }, [input, hydrated]);

  const result = useMemo(() => calculateSquareFootage(input), [input]);
  const metric = input.units === 'metric';
  const len = metric ? 'm' : 'ft';
  const sq = metric ? 'm²' : 'ft²';
  const show = (ft2: number, d = 2) => (metric ? `${fmt(ft2ToM2(ft2), d)} m²` : `${fmt(ft2, d)} ft²`);

  const update = (patch: Partial<SquareFootageInput>) => setInput((s) => ({ ...s, ...patch }));
  const updateRoom = (id: string, patch: Partial<RoomInput>) =>
    setInput((s) => ({ ...s, rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const setShape = (id: string, shape: Shape) =>
    setInput((s) => ({ ...s, rooms: s.rooms.map((r) => (r.id === id ? withShape(r, shape) : r)) }));
  const addRoom = (subtract = false) =>
    setInput((s) => {
      const rooms = s.rooms.filter((r) => !r.subtract).length;
      const cuts = s.rooms.filter((r) => r.subtract).length;
      const room: RoomInput = subtract
        ? { id: newId(), name: `Cut-out ${cuts + 1}`, shape: 'rectangle', a: metric ? 1 : 3, b: metric ? 1.5 : 5, qty: 1, subtract: true }
        : { id: newId(), name: `Room ${rooms + 1}`, shape: 'rectangle', a: metric ? 3 : 10, b: metric ? 3 : 10, qty: 1 };
      return { ...s, rooms: [...s.rooms, room] };
    });
  const removeRoom = (id: string) =>
    setInput((s) => ({ ...s, rooms: s.rooms.length > 1 ? s.rooms.filter((r) => r.id !== id) : s.rooms }));

  const switchUnits = (units: SquareFootageInput['units']) => {
    if (units === input.units) return;
    const k = units === 'metric' ? M_PER_FT : FT_PER_M;
    const r = (v: number | undefined, d = 3) => (v != null && Number.isFinite(v) ? Number(v.toFixed(d)) : v);
    setInput((s) => ({
      ...s,
      units,
      rooms: s.rooms.map((room) => ({
        ...room,
        a: room.shape === 'area' ? r(room.a * k * k, 2)! : r(room.a * k)!,
        b: r(room.b != null ? room.b * k : undefined),
        c: r(room.c != null ? room.c * k : undefined),
        d: r(room.d != null ? room.d * k : undefined),
      })),
      boxCoverage: r(s.boxCoverage != null ? s.boxCoverage * k * k : undefined, 2),
      priceUnit: units === 'metric' && s.priceUnit !== 'm2' ? 'm2' : units === 'imperial' && s.priceUnit === 'm2' ? 'ft2' : s.priceUnit,
      price:
        s.price != null && Number.isFinite(s.price)
          ? units === 'metric' && s.priceUnit !== 'm2'
            ? Number((s.price / (s.priceUnit === 'yd2' ? 9 : 1) / (M_PER_FT * M_PER_FT)).toFixed(2))
            : units === 'imperial' && s.priceUnit === 'm2'
              ? Number((s.price * M_PER_FT * M_PER_FT).toFixed(2))
              : s.price
          : s.price,
    }));
  };

  const activePreset = WASTE_PRESETS.find((p) => p.pct === input.wastePct)?.id ?? 'custom';
  const priceUnits: { value: PriceUnit; label: string }[] = metric
    ? [{ value: 'm2', label: 'per m²' }]
    : [
        { value: 'ft2', label: 'per ft²' },
        { value: 'yd2', label: 'per yd²' },
      ];

  const primary = show(result.netFt2);
  const orderText = show(result.orderFt2);

  const summary = [
    `Total area: ${fmt(result.netFt2, 2)} ft² (${fmt(result.netM2, 2)} m², ${fmt(result.netYd2, 2)} yd²)`,
    ...result.rooms.filter((r) => !r.error).map((r) => `  ${r.subtract ? '− ' : ''}${r.name}: ${fmt(Math.abs(r.areaFt2), 2)} ft²`),
    input.wastePct > 0 ? `With ${fmt(input.wastePct, 0)}% waste: ${fmt(result.orderFt2, 2)} ft²` : '',
    result.boxes > 0 ? `Boxes: ${result.boxes}` : '',
    result.cost != null ? `Cost: ${fmtMoney(result.cost)}` : '',
    typeof window !== 'undefined' ? shareUrl(encode(input)) : '',
  ]
    .filter(Boolean)
    .join('\n');

  const csvRows: (string | number)[][] = [
    ['Room', 'Shape', 'Qty', 'Area (ft²)', 'Area (m²)'],
    ...result.rooms
      .filter((r) => !r.error)
      .map((r) => [r.name, r.subtract ? `${SHAPE_NAMES[r.shape]} (cut-out)` : SHAPE_NAMES[r.shape], r.qty, fmt(r.areaFt2, 2), fmt(ft2ToM2(r.areaFt2), 2)]),
    ['Total', '', '', fmt(result.netFt2, 2), fmt(result.netM2, 2)],
    [`With ${fmt(input.wastePct, 0)}% waste`, '', '', fmt(result.orderFt2, 2), fmt(result.orderM2, 2)],
    ...(result.boxes > 0 ? [['Boxes', '', result.boxes, '', '']] : []),
    ...(result.cost != null ? [['Cost (USD)', '', '', result.cost.toFixed(2), '']] : []),
  ];

  const roomCount = input.rooms.filter((r) => !r.subtract).length;

  return (
    <div class="grid gap-5 md:gap-6 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] md:items-start">
      <form class="grid gap-4 min-w-0 grid-cols-[minmax(0,1fr)]" onSubmit={(e) => e.preventDefault()} aria-label="Square footage inputs">
        <div class="flex items-center justify-between gap-4 min-w-0">
          <span class="rule-label shrink-0 after:hidden">Rooms &amp; areas</span>
          <UnitToggle value={input.units} onChange={switchUnits} />
        </div>

        {input.rooms.map((room, i) => {
          const res = result.rooms.find((r) => r.id === room.id);
          const err = (v: number | undefined) => (res?.error && !(v != null && v >= 0) ? 'Enter 0 or more' : undefined);
          const cut = Boolean(room.subtract);
          return (
            <fieldset
              key={room.id}
              class={`rounded-card border p-3.5 grid gap-3.5 min-w-0 ${cut ? 'border-dashed border-ochre/60 bg-ochre-soft/40' : 'border-border bg-surface-sunken'}`}
            >
              <legend class={`px-2 ml-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] bg-surface border rounded-full py-0.5 ${cut ? 'text-ochre border-ochre/50' : 'text-muted border-border'}`}>
                {cut ? 'Cut-out · subtracted' : `Room ${i + 1 - input.rooms.slice(0, i).filter((r) => r.subtract).length}`}
              </legend>

              <div class="flex items-center gap-2 min-w-0">
                <div class="relative flex-1 min-w-0">
                  <label for={`${room.id}-name`} class="sr-only">
                    {cut ? 'Cut-out name' : 'Room name'}
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
                    id={`${room.id}-name`}
                    type="text"
                    data-kind="label"
                    enterKeyHint="next"
                    maxLength={40}
                    autoComplete="off"
                    placeholder={cut ? 'Cut-out name' : 'Room name'}
                    value={room.name}
                    onInput={(e) => updateRoom(room.id, { name: e.currentTarget.value })}
                    class="w-full h-11 pl-9 pr-3 rounded-field border border-transparent bg-transparent text-text text-base font-semibold outline-none transition-colors hover:border-border focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/15"
                  />
                </div>
                {input.rooms.length > 1 && (
                  <button
                    type="button"
                    class="min-h-12 px-2 text-[0.8125rem] font-medium text-muted hover:text-error transition-colors"
                    onClick={() => removeRoom(room.id)}
                    aria-label={`Remove ${room.name || `room ${i + 1}`}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* On phones the dimensions come first (docs/06 §1: fields on the first screen); the shape follows. */}
              <div class="order-last sm:order-none">
                <ShapePicker label={`Shape of ${room.name || `room ${i + 1}`}`} hideLabel value={room.shape} options={SHAPES} onChange={(shape) => setShape(room.id, shape)} />
              </div>

              <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))] items-end">
                {room.shape === 'rectangle' && (
                  <>
                    <NumberInput label="Length" unit={len} feet={!metric} value={room.a} onChange={(a) => updateRoom(room.id, { a })} error={err(room.a)} />
                    <NumberInput label="Width" unit={len} feet={!metric} value={room.b ?? NaN} onChange={(b) => updateRoom(room.id, { b })} error={err(room.b)} />
                  </>
                )}
                {room.shape === 'lshape' && (
                  <>
                    <NumberInput label="Part 1 length" unit={len} feet={!metric} value={room.a} onChange={(a) => updateRoom(room.id, { a })} error={err(room.a)} />
                    <NumberInput label="Part 1 width" unit={len} feet={!metric} value={room.b ?? NaN} onChange={(b) => updateRoom(room.id, { b })} error={err(room.b)} />
                    <NumberInput label="Part 2 length" unit={len} feet={!metric} value={room.c ?? NaN} onChange={(c) => updateRoom(room.id, { c })} error={err(room.c)} />
                    <NumberInput label="Part 2 width" unit={len} feet={!metric} value={room.d ?? NaN} onChange={(d) => updateRoom(room.id, { d })} error={err(room.d)} />
                  </>
                )}
                {room.shape === 'circle' && (
                  <NumberInput label="Diameter" unit={len} feet={!metric} value={room.a} onChange={(a) => updateRoom(room.id, { a })} error={err(room.a)} />
                )}
                {room.shape === 'triangle' && (
                  <>
                    <NumberInput label="Base" unit={len} feet={!metric} value={room.a} onChange={(a) => updateRoom(room.id, { a })} error={err(room.a)} />
                    <NumberInput label="Height" unit={len} feet={!metric} value={room.b ?? NaN} onChange={(b) => updateRoom(room.id, { b })} error={err(room.b)} />
                  </>
                )}
                {room.shape === 'trapezoid' && (
                  <>
                    <NumberInput label="Side a" hint="One parallel side" unit={len} feet={!metric} value={room.a} onChange={(a) => updateRoom(room.id, { a })} error={err(room.a)} />
                    <NumberInput label="Side b" hint="The other parallel side" unit={len} feet={!metric} value={room.b ?? NaN} onChange={(b) => updateRoom(room.id, { b })} error={err(room.b)} />
                    <NumberInput label="Height" hint="Distance between them" unit={len} feet={!metric} value={room.c ?? NaN} onChange={(c) => updateRoom(room.id, { c })} error={err(room.c)} />
                  </>
                )}
                {room.shape === 'area' && (
                  <NumberInput label="Area" unit={sq} value={room.a} onChange={(a) => updateRoom(room.id, { a })} error={err(room.a)} />
                )}
                <NumberInput
                  label={cut ? 'How many' : 'Identical rooms'}
                  integer
                  min={1}
                  max={99}
                  steppers
                  value={room.qty}
                  onChange={(qty) => updateRoom(room.id, { qty })}
                />
              </div>

              {res && !res.error && (
                <p class="figure m-0 text-[0.6875rem] font-mono text-muted">
                  {cut ? '− ' : ''}
                  {show(Math.abs(res.areaFt2))}
                  {res.qty > 1 ? ` (${res.qty} × ${show(res.unitAreaFt2)})` : ''}
                </p>
              )}
            </fieldset>
          );
        })}

        <div class="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[2fr_1fr] gap-2">
          <button
            type="button"
            onClick={() => addRoom(false)}
            class="min-h-12 rounded-field border border-dashed border-accent-line text-accent text-[0.9375rem] font-semibold hover:bg-accent-soft hover:border-accent transition-colors"
          >
            + Add another room
          </button>
          <button
            type="button"
            onClick={() => addRoom(true)}
            class="min-h-12 rounded-field border border-dashed border-ochre/60 text-ochre text-[0.875rem] font-semibold hover:bg-ochre-soft/60 transition-colors"
          >
            − Subtract a cut-out
          </button>
        </div>

        <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))] items-end">
          <Segmented
            label="Extra for waste"
            value={activePreset}
            onChange={(id) => {
              const p = WASTE_PRESETS.find((x) => x.id === id);
              if (p) update({ wastePct: p.pct });
            }}
            options={[
              ...WASTE_PRESETS.map((p) => ({ value: p.id, label: `${p.label} ${p.pct}%` })),
              ...(activePreset === 'custom' ? [{ value: 'custom' as const, label: 'Custom' }] : []),
            ]}
          />
          <NumberInput
            label="Waste"
            unit="%"
            integer
            min={0}
            max={MAX_WASTE_PCT}
            steppers
            value={input.wastePct}
            onChange={(wastePct) => update({ wastePct })}
            hint={WASTE_PRESETS.find((p) => p.id === activePreset)?.note ?? 'Your own allowance'}
          />
        </div>

        <details class="group rounded-card border border-border bg-surface-sunken p-3.5" open={input.boxCoverage != null || input.price != null}>
          <summary class="cursor-pointer list-none text-[0.875rem] font-semibold min-h-9 flex items-center gap-2 text-text">
            <span
              aria-hidden="true"
              class="grid place-items-center h-5 w-5 rounded-full border border-border text-[0.65rem] leading-none text-muted transition-transform duration-200 group-open:rotate-90"
            >
              ▸
            </span>
            Boxes and price <span class="font-normal text-muted">(optional)</span>
          </summary>
          <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(3,minmax(0,1fr))] mt-3 items-end">
            <NumberInput
              label="Coverage per box"
              unit={sq}
              value={input.boxCoverage ?? NaN}
              onChange={(v) => update({ boxCoverage: Number.isFinite(v) && v > 0 ? v : undefined })}
              hint="Printed on the box"
            />
            <NumberInput
              label="Price"
              unit="$"
              value={input.price ?? NaN}
              onChange={(v) => update({ price: Number.isFinite(v) ? v : undefined })}
              hint="Leave empty to skip cost"
            />
            <Segmented label="Price is" value={input.priceUnit} onChange={(priceUnit) => update({ priceUnit })} options={priceUnits} />
          </div>
        </details>
      </form>

      <div class="grid gap-3 md:sticky md:top-28">
        <ResultCard
          id="sqft-result"
          primaryLabel={roomCount > 1 || result.deductedFt2 > 0 ? 'Total area' : 'Area'}
          primary={primary}
          secondary={[
            { label: `With ${fmt(input.wastePct, 0)}% waste`, value: orderText },
            metric ? { label: 'Square feet', value: `${fmt(result.netFt2, 2)} ft²` } : { label: 'Square meters', value: `${fmt(result.netM2, 2)} m²` },
            { label: 'Square yards', value: `${fmt(result.netYd2, 2)} yd²` },
            { label: 'Acres', value: fmt(result.netAcres, 4) },
            ...(result.boxes > 0 ? [{ label: 'Boxes to buy', value: `${result.boxes}`, hint: 'Rounded up' }] : []),
            ...(result.cost != null ? [{ label: 'Estimated cost', value: fmtMoney(result.cost) }] : []),
          ]}
          note={
            <>
              {result.deductedFt2 > 0 && (
                <>
                  Rooms {show(result.grossFt2)} − cut-outs {show(result.deductedFt2)}.{' '}
                </>
              )}
              Measured inside the walls. Waste covers cuts and breakage.
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
              <ShareButton url={hydrated ? shareUrl(encode(input)) : ''} title="Square footage calculator result" />
              <PrintButton />
              <CsvButton filename="square-footage" rows={csvRows} />
            </>
          }
        />

        {input.rooms.length > 1 && (
          <ResultTable
            caption="Room schedule"
            columns={['Room', sq, metric ? 'ft²' : 'm²']}
            rows={[
              ...result.rooms
                .filter((r) => !r.error)
                .map((r) => [
                  `${r.subtract ? '− ' : ''}${r.name}${r.qty > 1 ? ` ×${r.qty}` : ''}`,
                  metric ? fmt(ft2ToM2(r.areaFt2), 2) : fmt(r.areaFt2, 2),
                  metric ? fmt(r.areaFt2, 1) : fmt(ft2ToM2(r.areaFt2), 2),
                ]),
              ['Total', metric ? fmt(result.netM2, 2) : fmt(result.netFt2, 2), metric ? fmt(result.netFt2, 1) : fmt(result.netM2, 2)],
            ]}
            compact
          />
        )}
      </div>

      <StickyResult watchId="sqft-result" label={roomCount > 1 ? 'Total area' : 'Area'} value={primary} secondary={`+${fmt(input.wastePct, 0)}%: ${orderText}`} />
    </div>
  );
}

