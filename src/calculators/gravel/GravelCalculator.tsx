import { useEffect, useMemo, useState } from 'preact/hooks';
import { NumberInput, Segmented, UnitToggle, ResultCard, ResultTable, StickyResult, CopyButton, ShareButton, PrintButton, CsvButton } from '@/components/ui';
import { fmt, fmtMoney } from '@/lib/format';
import { readParams, writeParams, shareUrl, compact } from '@/lib/url-state';
import { calculateGravel, DEFAULT_INPUT, coverageTable, suggestedOrderYd3, lbFt3ToKgM3, kgM3ToLbFt3 } from './logic';
import { GRAVEL_TYPES, CUSTOM_TYPE_ID, DEFAULT_TYPE_ID, gravelTypeById } from './gravel-types';
import type { AreaInput, GravelInput, Shape, PriceUnit } from './types';

/**
 * Gravel calculator island. Server-rendered with the default example, hydrated on load.
 * Multiple areas · shape selector · imperial/metric · gravel type with visible density ·
 * waste % · price · bags · "How it's calculated" · sticky result · Copy/Share/Print/CSV.
 */

const SHAPES: { value: Shape; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'area', label: 'Area' },
];

let seq = 1;
const newId = () => `a${Date.now().toString(36)}${seq++}`;

/* ---------- URL state ---------- */

const SHAPE_CODES: Record<Shape, string> = { rectangle: 'rect', circle: 'circ', triangle: 'tri', area: 'area' };
const CODE_SHAPES: Record<string, Shape> = { rect: 'rectangle', circ: 'circle', tri: 'triangle', area: 'area' };

function encode(input: GravelInput): URLSearchParams {
  const p = new URLSearchParams();
  p.set('u', input.units === 'metric' ? 'met' : 'imp');
  p.set('a', input.areas.map((a) => [SHAPE_CODES[a.shape], compact(a.a), a.b != null ? compact(a.b) : '', compact(a.depth)].join(':')).join(';'));
  p.set('t', input.gravelTypeId);
  if (input.gravelTypeId === CUSTOM_TYPE_ID && input.customDensityLbFt3 != null) p.set('d', compact(input.customDensityLbFt3));
  p.set('w', compact(input.wastePct));
  if (input.bagSizeFt3 !== DEFAULT_INPUT.bagSizeFt3) p.set('bag', compact(input.bagSizeFt3));
  if (input.price != null && Number.isFinite(input.price)) {
    p.set('p', compact(input.price));
    p.set('pu', input.priceUnit);
  }
  return p;
}

function decode(p: URLSearchParams, defaults: GravelInput): GravelInput {
  if (!p.has('a') && !p.has('t')) return defaults;
  const n = (v: string | null | undefined, fb: number) => {
    if (v == null || v === '') return fb;
    const x = Number(v);
    return Number.isFinite(x) ? x : fb;
  };
  const areas: AreaInput[] = (p.get('a') ?? '')
    .split(';')
    .filter(Boolean)
    .map((chunk) => {
      const [code, a, b, d] = chunk.split(':');
      const shape = CODE_SHAPES[code ?? ''] ?? 'rectangle';
      return { id: newId(), shape, a: n(a, 10), b: b === '' || b == null ? undefined : n(b, 10), depth: n(d, 3) };
    })
    .filter((a) => a.shape !== 'rectangle' || a.b != null || (a.b = 10) != null);
  const typeId = p.get('t') ?? defaults.gravelTypeId;
  const validType = typeId === CUSTOM_TYPE_ID || gravelTypeById(typeId) ? typeId : DEFAULT_TYPE_ID;
  const price = p.has('p') ? n(p.get('p'), NaN) : undefined;
  return {
    units: p.get('u') === 'met' ? 'metric' : 'imperial',
    areas: areas.length ? areas : defaults.areas,
    gravelTypeId: validType,
    customDensityLbFt3: validType === CUSTOM_TYPE_ID ? n(p.get('d'), 105) : undefined,
    wastePct: Math.min(50, Math.max(0, n(p.get('w'), defaults.wastePct))),
    bagSizeFt3: n(p.get('bag'), defaults.bagSizeFt3),
    price: price != null && Number.isFinite(price) ? price : undefined,
    priceUnit: (p.get('pu') === 'ton' ? 'ton' : 'yd3') as PriceUnit,
  };
}

/* ---------- component ---------- */

export default function GravelCalculator() {
  const [input, setInput] = useState<GravelInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);
  const [priceText, setPriceText] = useState<number>(NaN);

  // Restore shared state after hydration (SSR renders the default example).
  useEffect(() => {
    const restored = decode(readParams(), DEFAULT_INPUT);
    setInput(restored);
    setPriceText(restored.price ?? NaN);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeParams(encode(input));
  }, [input, hydrated]);

  const result = useMemo(() => calculateGravel(input), [input]);
  const metric = input.units === 'metric';
  const lenUnit = metric ? 'm' : 'ft';
  const depthUnit = metric ? 'cm' : 'in';
  const type = gravelTypeById(input.gravelTypeId);
  const orderYd3 = suggestedOrderYd3(result.orderVolumeYd3);
  const coverage = useMemo(() => coverageTable(result.densityLbFt3), [result.densityLbFt3]);

  const update = (patch: Partial<GravelInput>) => setInput((s) => ({ ...s, ...patch }));
  const updateArea = (id: string, patch: Partial<AreaInput>) =>
    setInput((s) => ({ ...s, areas: s.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  const addArea = () => setInput((s) => ({ ...s, areas: [...s.areas, { id: newId(), shape: 'rectangle', a: 10, b: 10, depth: s.areas.at(-1)?.depth ?? 3 }] }));
  const removeArea = (id: string) => setInput((s) => ({ ...s, areas: s.areas.length > 1 ? s.areas.filter((a) => a.id !== id) : s.areas }));

  const switchUnits = (units: GravelInput['units']) => {
    if (units === input.units) return;
    const k = units === 'metric' ? 0.3048 : 1 / 0.3048; // ft → m or m → ft
    const kd = units === 'metric' ? 2.54 : 1 / 2.54; // in → cm or cm → in
    const r = (n: number, d = 3) => (Number.isFinite(n) ? Number((n * 1).toFixed(d)) : n);
    setInput((s) => ({
      ...s,
      units,
      areas: s.areas.map((a) => ({
        ...a,
        a: a.shape === 'area' ? r(a.a * k * k) : r(a.a * k),
        b: a.b != null ? r(a.b * k) : undefined,
        depth: r(a.depth * kd, 2),
      })),
    }));
  };

  const primary = metric ? `${fmt(result.orderVolumeM3, 2)} m³` : `${fmt(result.orderVolumeYd3, 2)} yd³`;
  const tonsText = metric ? `${fmt(result.weightMetricTons, 2)} t` : `${fmt(result.weightTons, 2)} tons`;

  const summary = [
    `Gravel needed: ${primary} (${fmt(result.volumeYd3, 2)} yd³ + ${fmt(input.wastePct, 0)}% waste)`,
    `Weight: ${fmt(result.weightTons, 2)} US tons (${fmt(result.weightLb, 0)} lb) at ${fmt(result.densityLbFt3, 0)} lb/ft³`,
    `Bags: ${result.bags} × ${fmt(input.bagSizeFt3, 2)} ft³`,
    result.cost != null ? `Cost: ${fmtMoney(result.cost)}` : '',
    typeof window !== 'undefined' ? shareUrl(encode(input)) : '',
  ]
    .filter(Boolean)
    .join('\n');

  const csvRows: (string | number)[][] = [
    ['Item', 'Value', 'Unit'],
    ...result.areas.map((a, i) => [`Area ${i + 1} (${a.shape})`, fmt(a.areaFt2, 2), 'ft²']),
    ['Volume', fmt(result.volumeYd3, 3), 'yd³'],
    [`Order volume (+${fmt(input.wastePct, 0)}%)`, fmt(result.orderVolumeYd3, 3), 'yd³'],
    ['Order volume', fmt(result.orderVolumeM3, 3), 'm³'],
    ['Density', fmt(result.densityLbFt3, 0), 'lb/ft³'],
    ['Weight', fmt(result.weightTons, 3), 'US tons'],
    ['Weight', fmt(result.weightLb, 0), 'lb'],
    ['Bags', result.bags, `${input.bagSizeFt3} ft³ bags`],
    ...(result.cost != null ? [['Cost', result.cost.toFixed(2), 'USD']] : []),
  ];

  return (
    <div class="grid gap-5 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] md:items-start">
      <form class="grid gap-4 min-w-0 grid-cols-[minmax(0,1fr)]" onSubmit={(e) => e.preventDefault()} aria-label="Gravel inputs">
        <div class="flex items-center justify-between gap-3 min-w-0">
          <span class="text-sm font-semibold shrink-0">Areas to cover</span>
          <UnitToggle value={input.units} onChange={switchUnits} />
        </div>

        {input.areas.map((area, i) => {
          const res = result.areas.find((r) => r.id === area.id);
          return (
            <fieldset key={area.id} class="rounded-lg border border-border p-3 grid gap-3 min-w-0">
              <legend class="px-1 text-sm font-medium">Area {i + 1}</legend>
              <div class="flex flex-wrap items-end justify-between gap-2 min-w-0">
                <div class="min-w-0 max-w-full">
                  <Segmented label={`Shape of area ${i + 1}`} hideLabel size="sm" value={area.shape} options={SHAPES} onChange={(shape) => updateArea(area.id, { shape, b: shape === 'rectangle' || shape === 'triangle' ? (area.b ?? 10) : undefined })} />
                </div>
                {input.areas.length > 1 && (
                  <button type="button" class="min-h-10 px-3 text-sm text-muted hover:text-error" onClick={() => removeArea(area.id)} aria-label={`Remove area ${i + 1}`}>
                    Remove
                  </button>
                )}
              </div>

              <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
                {area.shape === 'rectangle' && (
                  <>
                    <NumberInput label="Length" unit={lenUnit} feet={!metric} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={res?.error && !(area.a >= 0) ? 'Enter 0 or more' : undefined} />
                    <NumberInput label="Width" unit={lenUnit} feet={!metric} value={area.b ?? NaN} onChange={(b) => updateArea(area.id, { b })} error={res?.error && !((area.b ?? -1) >= 0) ? 'Enter 0 or more' : undefined} />
                  </>
                )}
                {area.shape === 'circle' && (
                  <NumberInput label="Diameter" unit={lenUnit} feet={!metric} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={res?.error && !(area.a >= 0) ? 'Enter 0 or more' : undefined} />
                )}
                {area.shape === 'triangle' && (
                  <>
                    <NumberInput label="Base" unit={lenUnit} feet={!metric} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={res?.error && !(area.a >= 0) ? 'Enter 0 or more' : undefined} />
                    <NumberInput label="Height" unit={lenUnit} feet={!metric} value={area.b ?? NaN} onChange={(b) => updateArea(area.id, { b })} error={res?.error && !((area.b ?? -1) >= 0) ? 'Enter 0 or more' : undefined} />
                  </>
                )}
                {area.shape === 'area' && (
                  <NumberInput label="Area" unit={metric ? 'm²' : 'ft²'} value={area.a} onChange={(a) => updateArea(area.id, { a })} error={res?.error && !(area.a >= 0) ? 'Enter 0 or more' : undefined} />
                )}
                <NumberInput label="Depth" unit={depthUnit} value={area.depth} onChange={(depth) => updateArea(area.id, { depth })} error={res?.error && !(area.depth >= 0) ? 'Enter 0 or more' : undefined} hint={i === 0 ? (metric ? 'Paths 5–8 cm, driveways 10–15 cm' : 'Paths 2–3 in, driveways 4–6 in') : undefined} />
              </div>
              {res && !res.error && input.areas.length > 1 && (
                <p class="m-0 text-xs text-muted">
                  {fmt(res.areaFt2, 1)} ft² · {fmt(res.volumeYd3, 2)} yd³
                </p>
              )}
            </fieldset>
          );
        })}

        <button type="button" onClick={addArea} class="min-h-12 rounded-lg border border-dashed border-accent text-accent font-medium hover:bg-accent-soft">
          + Add another area
        </button>

        <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(2,minmax(0,1fr))]">
          <div class="flex flex-col gap-1 min-w-0">
            <label for="gravel-type" class="text-sm font-medium">
              Gravel type
            </label>
            <select
              id="gravel-type"
              class="h-12 w-full min-w-0 max-w-full px-3 rounded-lg border border-border bg-surface text-base"
              value={input.gravelTypeId}
              onChange={(e) => {
                const id = (e.currentTarget as HTMLSelectElement).value;
                update({ gravelTypeId: id, customDensityLbFt3: id === CUSTOM_TYPE_ID ? result.densityLbFt3 : undefined });
              }}
            >
              {GRAVEL_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} — {fmt(t.densityLbFt3, 0)} lb/ft³
                </option>
              ))}
              <option value={CUSTOM_TYPE_ID}>Custom density…</option>
            </select>
            {type && <span class="text-xs text-muted">{type.note}</span>}
          </div>

          {input.gravelTypeId === CUSTOM_TYPE_ID ? (
            <NumberInput
              label={`Density (${metric ? 'kg/m³' : 'lb/ft³'})`}
              value={metric ? Math.round(lbFt3ToKgM3(input.customDensityLbFt3 ?? 105)) : (input.customDensityLbFt3 ?? 105)}
              onChange={(v) => update({ customDensityLbFt3: metric ? kgM3ToLbFt3(v) : v })}
              warning={result.warnings.find((w) => w.startsWith('Density'))}
              hint="Ask your supplier; 95–125 lb/ft³ is typical"
            />
          ) : (
            <NumberInput label="Extra for waste & compaction" unit="%" integer min={0} max={50} value={input.wastePct} onChange={(wastePct) => update({ wastePct })} hint="Contractors add 5–15 %" steppers />
          )}
        </div>

        <details class="rounded-lg border border-border p-3">
          <summary class="cursor-pointer text-sm font-medium min-h-8 flex items-center">Price and bag size (optional)</summary>
          <div class="grid gap-3 grid-cols-[minmax(0,1fr)] sm:grid-cols-[repeat(3,minmax(0,1fr))] mt-3">
            {input.gravelTypeId === CUSTOM_TYPE_ID && (
              <NumberInput label="Extra for waste" unit="%" integer min={0} max={50} value={input.wastePct} onChange={(wastePct) => update({ wastePct })} />
            )}
            <NumberInput
              label="Price"
              unit="$"
              value={priceText}
              onChange={(v) => {
                setPriceText(v);
                update({ price: Number.isFinite(v) ? v : undefined });
              }}
              hint="Leave empty to skip cost"
            />
            <Segmented label="Price per" value={input.priceUnit} onChange={(priceUnit) => update({ priceUnit })} options={[{ value: 'yd3', label: 'per yd³' }, { value: 'ton', label: 'per ton' }]} />
            <Segmented
              label="Bag size"
              value={String(input.bagSizeFt3)}
              onChange={(v) => update({ bagSizeFt3: Number(v) })}
              options={[
                { value: '0.5', label: '0.5 ft³' },
                { value: '1', label: '1 ft³' },
              ]}
            />
          </div>
        </details>
      </form>

      <div class="grid gap-3 md:sticky md:top-20">
        <ResultCard
          id="gravel-result"
          primaryLabel={`Gravel to order (incl. ${fmt(input.wastePct, 0)}% extra)`}
          primary={primary}
          secondary={[
            { label: metric ? 'Weight' : 'Weight (US tons)', value: tonsText, hint: `${fmt(result.weightLb, 0)} lb` },
            { label: 'Bags', value: `${result.bags}`, hint: `${input.bagSizeFt3} ft³ bags` },
            { label: metric ? 'Cubic yards' : 'Cubic feet', value: metric ? `${fmt(result.orderVolumeYd3, 2)} yd³` : `${fmt(result.orderVolumeFt3, 1)} ft³` },
            { label: 'Suggested order', value: orderYd3 > 0 ? `${fmt(orderYd3, 1)} yd³` : '—', hint: 'Rounded up to ½ yard' },
            ...(result.cost != null ? [{ label: 'Estimated cost', value: fmtMoney(result.cost) }] : []),
          ]}
          note={
            <>
              Density {fmt(result.densityLbFt3, 0)} lb/ft³ ≈ {fmt(result.tonsPerYd3, 2)} tons/yd³ ({type ? type.label : 'custom'}). Before extra: {fmt(result.volumeYd3, 2)} yd³ · {fmt(result.areaFt2, 0)} ft² total.
              {result.warnings.filter((w) => !w.startsWith('Density')).map((w) => (
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
              <ShareButton url={hydrated ? shareUrl(encode(input)) : ''} title="Gravel calculator result" />
              <PrintButton />
              <CsvButton filename="gravel-estimate" rows={csvRows} />
            </>
          }
        />

        <ResultTable
          caption={`Coverage at ${fmt(result.densityLbFt3, 0)} lb/ft³`}
          columns={['Depth', '1 yd³ covers', '1 ton covers']}
          rows={coverage.map((c) => [`${c.depthIn} in`, `${fmt(c.perYd3, 0)} ft²`, `${fmt(c.perTon, 0)} ft²`])}
          compact
        />
      </div>

      <StickyResult watchId="gravel-result" label="Gravel to order" value={primary} secondary={tonsText} />
    </div>
  );
}
