import { useEffect, useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { ResultTable, CopyButton, ShareButton, PrintButton } from '@/components/ui';
import { readParams, writeParams, shareUrl, compact } from '@/lib/url-state';
import { parseNumber } from '@/lib/parse-input';
import { answer, percentOf, num, pct, DEFAULT_INPUT, COMMON_PCTS, MODES } from './logic';
import type { Answer, Mode, PercentageInput, Direction } from './logic';

/**
 * Percentage calculator island. Six questions written as sentences with the numbers inside them,
 * all answered live: P% of X · X is what % of Y · X is P% of what · % change · increase/decrease by P% ·
 * % difference. Each shows its steps; a table of common percentages follows the first number.
 * Brief: docs/briefs/percentage-calculator.md
 */

/* ---------- URL state: only the questions that differ from the example ---------- */

const KEYS: Record<Mode, [string, string]> = {
  of: ['p', 'x'],
  isWhat: ['x', 'y'],
  ofWhat: ['x', 'p'],
  change: ['a', 'b'],
  apply: ['x', 'p'],
  diff: ['a', 'b'],
};

function encode(input: PercentageInput): URLSearchParams {
  const q = new URLSearchParams();
  for (const m of MODES) {
    const [k1, k2] = KEYS[m];
    const cur = input[m] as Record<string, number | string>;
    const def = DEFAULT_INPUT[m] as Record<string, number | string>;
    const extra = m === 'apply' && input.apply.dir !== DEFAULT_INPUT.apply.dir;
    if (cur[k1] !== def[k1] || cur[k2] !== def[k2] || extra) {
      q.set(m, [compact(cur[k1] as number), compact(cur[k2] as number), m === 'apply' ? input.apply.dir : ''].filter((v, i) => i < 2 || v).join('_'));
    }
  }
  return q;
}

function decode(q: URLSearchParams, defaults: PercentageInput): PercentageInput {
  const next: PercentageInput = JSON.parse(JSON.stringify(defaults));
  for (const m of MODES) {
    const raw = q.get(m);
    if (!raw) continue;
    const [v1, v2, dir] = raw.split('_');
    const [k1, k2] = KEYS[m];
    const a = Number(v1);
    const b = Number(v2);
    const target = next[m] as Record<string, number | string>;
    if (Number.isFinite(a)) target[k1] = a;
    if (Number.isFinite(b)) target[k2] = b;
    if (m === 'apply' && (dir === 'up' || dir === 'down')) next.apply.dir = dir;
  }
  return next;
}

/* ---------- pieces ---------- */

/** A number field inside a sentence; its label is visually the sentence around it. */
function InlineNumber(props: { id: string; label: string; value: number; onChange: (v: number) => void; suffix?: string; wide?: boolean }) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (Number.isFinite(props.value) ? String(props.value) : '');
  return (
    <span class="inline-flex items-stretch align-middle">
      <label for={props.id} class="sr-only">
        {props.label}
      </label>
      <input
        id={props.id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={shown}
        onInput={(e) => {
          const raw = e.currentTarget.value;
          setText(raw);
          props.onChange(parseNumber(raw));
        }}
        onBlur={() => setText(null)}
        class={`figure h-12 ${props.wide ? 'w-24 sm:w-[7.5rem]' : 'w-[4.25rem] sm:w-[5.25rem]'} px-2.5 text-center text-[1.0625rem] font-semibold rounded-field border border-border bg-surface text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15 ${props.suffix ? 'rounded-r-none border-r-0' : ''}`}
      />
      {props.suffix && (
        <span aria-hidden="true" class="grid place-items-center px-2.5 rounded-r-field border border-border bg-surface-2 font-mono text-[0.8125rem] text-muted">
          {props.suffix}
        </span>
      )}
    </span>
  );
}

function Question(props: { n: number; title: string; children: ComponentChildren; result: Answer; primary?: boolean }) {
  const { result } = props;
  return (
    <section class="rounded-card border border-border bg-surface-sunken p-3.5 md:p-4 grid gap-3 min-w-0" aria-label={props.title}>
      <p class="rule-label m-0">
        {String(props.n).padStart(2, '0')} · {props.title}
      </p>
      <div class="flex flex-wrap items-center gap-x-2 gap-y-2 text-[1.0625rem] leading-snug text-text">{props.children}</div>
      <div class="flex items-baseline justify-between gap-3 border-t border-border pt-2.5 min-w-0">
        <span class="font-mono text-[0.6875rem] uppercase tracking-wider text-muted shrink-0">Answer</span>
        <span
          class={`figure font-semibold text-right break-all ${props.primary ? 'text-[1.75rem] leading-none' : 'text-[1.375rem] leading-tight'} ${result.error ? 'text-muted text-base' : 'text-accent'}`}
          aria-live="polite"
          aria-atomic="true"
          data-testid={props.primary ? 'primary-result' : undefined}
        >
          {result.error ? result.error : result.text}
        </span>
      </div>
      {!result.error && result.steps.length > 0 && (
        <details class="group">
          <summary class="cursor-pointer list-none inline-flex items-center gap-2 min-h-9 text-[0.8125rem] font-medium text-accent">
            <span aria-hidden="true" class="grid place-items-center h-5 w-5 rounded-full border border-accent-line text-[0.65rem] leading-none transition-transform duration-200 group-open:rotate-90">
              ▸
            </span>
            How it&rsquo;s calculated
          </summary>
          <ol class="m-0 mt-2 p-0 list-none text-sm divide-y divide-border border-t border-border">
            {result.steps.map((s, i) => (
              <li key={i} class="grid grid-cols-[auto_1fr] gap-x-3 py-1.5">
                <span class="text-muted text-[0.8125rem]">{s.label}</span>
                <span class="font-mono text-[0.8125rem] break-words text-text text-right">
                  {s.expression} = <strong class="font-semibold">{s.value}</strong>
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

/* ---------- component ---------- */

export default function PercentageCalculator() {
  const [input, setInput] = useState<PercentageInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setInput(decode(readParams(), DEFAULT_INPUT));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeParams(encode(input));
  }, [input, hydrated]);

  const answers = useMemo(() => Object.fromEntries(MODES.map((m) => [m, answer(m, input)])) as Record<Mode, Answer>, [input]);
  const set = <M extends Mode>(m: M, patch: Partial<PercentageInput[M]>) => setInput((s) => ({ ...s, [m]: { ...s[m], ...patch } }));
  const setDir = (dir: Direction) => set('apply', { dir });

  const summary = [...MODES.map((m) => answers[m].sentence).filter(Boolean), typeof window !== 'undefined' ? shareUrl(encode(input)) : ''].filter(Boolean).join('\n');

  const base = input.of.x;
  return (
    <div class="grid gap-5 md:gap-6 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] md:items-start">
      <div class="grid gap-3.5 min-w-0">
        <Question n={1} title="Percent of a number" result={answers.of} primary>
          <span>What is</span>
          <InlineNumber id="of-p" label="Percent" value={input.of.p} onChange={(p) => set('of', { p })} suffix="%" />
          <span>of</span>
          <InlineNumber id="of-x" label="Number" value={input.of.x} onChange={(x) => set('of', { x })} wide />
          <span>?</span>
        </Question>

        <Question n={2} title="What percent is it" result={answers.isWhat}>
          <InlineNumber id="iw-x" label="Part" value={input.isWhat.x} onChange={(x) => set('isWhat', { x })} wide />
          <span>is what % of</span>
          <InlineNumber id="iw-y" label="Whole" value={input.isWhat.y} onChange={(y) => set('isWhat', { y })} wide />
          <span>?</span>
        </Question>

        <Question n={3} title="Find the whole" result={answers.ofWhat}>
          <InlineNumber id="ow-x" label="Part" value={input.ofWhat.x} onChange={(x) => set('ofWhat', { x })} wide />
          <span>is</span>
          <InlineNumber id="ow-p" label="Percent" value={input.ofWhat.p} onChange={(p) => set('ofWhat', { p })} suffix="%" />
          <span>of what?</span>
        </Question>

        <Question n={4} title="Percent change" result={answers.change}>
          <span>From</span>
          <InlineNumber id="ch-a" label="Starting value" value={input.change.a} onChange={(a) => set('change', { a })} wide />
          <span>to</span>
          <InlineNumber id="ch-b" label="New value" value={input.change.b} onChange={(b) => set('change', { b })} wide />
          <span>is what % change?</span>
        </Question>

        <Question n={5} title="Increase or decrease by a percent" result={answers.apply}>
          <InlineNumber id="ap-x" label="Number" value={input.apply.x} onChange={(x) => set('apply', { x })} wide />
          <span role="radiogroup" aria-label="Increase or decrease" class="inline-flex h-12 rounded-field border border-border bg-surface-2 p-[3px]">
            {(['up', 'down'] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={input.apply.dir === d}
                onClick={() => setDir(d)}
                class={`px-3 rounded-[0.3rem] text-[0.875rem] font-semibold transition duration-150 ${input.apply.dir === d ? 'bg-surface text-accent shadow-card' : 'text-muted hover:text-text'}`}
              >
                {d === 'up' ? '+ increase' : '− decrease'}
              </button>
            ))}
          </span>
          <span>by</span>
          <InlineNumber id="ap-p" label="Percent" value={input.apply.p} onChange={(p) => set('apply', { p })} suffix="%" />
        </Question>

        <Question n={6} title="Percent difference" result={answers.diff}>
          <span>Difference between</span>
          <InlineNumber id="df-a" label="First value" value={input.diff.a} onChange={(a) => set('diff', { a })} wide />
          <span>and</span>
          <InlineNumber id="df-b" label="Second value" value={input.diff.b} onChange={(b) => set('diff', { b })} wide />
        </Question>

        <div class="flex flex-wrap gap-2 no-print">
          <CopyButton text={summary} />
          <ShareButton url={hydrated ? shareUrl(encode(input)) : ''} title="Percentage calculator" />
          <PrintButton />
        </div>
      </div>

      <div class="grid gap-3 md:sticky md:top-28">
        <ResultTable
          caption={`Common percentages of ${num(base)}`}
          columns={['Percent', 'Amount', "What's left"]}
          rows={COMMON_PCTS.map((p) => {
            const v = percentOf(p, base).value;
            return [pct(p), num(v), Number.isFinite(base) ? num(base - v) : '—'];
          })}
          compact
        />
        <p class="m-0 text-xs text-muted leading-relaxed">
          The table follows the number in question 1. "What's left" is the price after a discount of that size — {pct(20)} off {num(base)} leaves {num(base - percentOf(20, base).value)}.
        </p>
      </div>
    </div>
  );
}
