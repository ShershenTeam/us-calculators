import type { ComponentChildren } from 'preact';

export interface Step {
  label: string;
  expression: string;
  value: string;
}

export interface ResultCardProps {
  /** Big headline value, e.g. "1.02 yd³". */
  primary: string;
  primaryLabel: string;
  /** Secondary values shown as a compact grid. */
  secondary?: { label: string; value: string; hint?: string }[];
  steps?: Step[];
  /** Buttons row (Copy / Share / Print / CSV). */
  actions?: ComponentChildren;
  /** Assumptions line under the result, e.g. density and waste. */
  note?: ComponentChildren;
  id?: string;
}

/**
 * Result block: one large number, secondary values, "How it's calculated" with
 * substituted numbers, and action buttons. Announced via aria-live (docs/06 §3, §7).
 * Design: the answer panel of a field manual — ruler edge, mono caption,
 * tabular figures, hairline-separated readings (docs/11 §6).
 */
export function ResultCard(props: ResultCardProps) {
  const id = props.id ?? 'result';
  return (
    <section
      id={id}
      aria-labelledby={`${id}-label`}
      class="ruled-top overflow-hidden rounded-card border border-accent-line/60 bg-accent-soft px-4 pt-5 pb-4 md:px-5 md:pt-6 md:pb-5"
    >
      <p id={`${id}-label`} class="rule-label m-0">
        {props.primaryLabel}
      </p>
      <p
        class="figure m-0 mt-2 text-[2.375rem] md:text-[2.75rem] leading-none font-semibold text-text"
        aria-live="polite"
        aria-atomic="true"
        data-testid="primary-result"
      >
        {props.primary}
      </p>

      {props.secondary && props.secondary.length > 0 && (
        <dl class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 m-0 border-t border-accent-line/40">
          {props.secondary.map((s) => (
            <div key={s.label} class="min-w-0 py-2 border-b border-accent-line/40">
              {/* Fixed label height so every reading's figure sits on one baseline. */}
              <dt class="text-[0.625rem] leading-tight uppercase tracking-wider text-muted font-mono min-h-[2.1em]">{s.label}</dt>
              <dd class="figure m-0 mt-1 text-[1.0625rem] font-semibold text-text truncate" title={s.hint}>
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {props.note && <p class="m-0 mt-3 text-xs leading-relaxed text-muted">{props.note}</p>}

      {props.steps && props.steps.length > 0 && (
        <details class="mt-3 group">
          <summary class="cursor-pointer list-none inline-flex items-center gap-2 min-h-10 text-sm font-medium text-accent">
            <span
              aria-hidden="true"
              class="grid place-items-center h-5 w-5 rounded-full border border-accent-line text-[0.65rem] leading-none transition-transform duration-200 group-open:rotate-90"
            >
              ▸
            </span>
            How it&rsquo;s calculated
          </summary>
          <ol class="m-0 mt-2.5 p-0 list-none text-sm divide-y divide-accent-line/30 border-t border-accent-line/30">
            {props.steps.map((s, i) => (
              <li key={i} class="grid grid-cols-[auto_1fr] gap-x-3 py-1.5">
                <span class="text-muted text-[0.8125rem]">{s.label}</span>
                <span class="font-mono text-[0.8125rem] break-words text-text">
                  {s.expression} = <strong class="font-semibold">{s.value}</strong>
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}

      {props.actions && <div class="mt-4 flex flex-wrap gap-2 no-print">{props.actions}</div>}
    </section>
  );
}
