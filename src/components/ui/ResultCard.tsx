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
 */
export function ResultCard(props: ResultCardProps) {
  const id = props.id ?? 'result';
  return (
    <section id={id} aria-labelledby={`${id}-label`} class="rounded-card bg-accent-soft/60 border border-accent/30 p-4 md:p-5">
      <p id={`${id}-label`} class="m-0 text-sm font-medium text-muted">
        {props.primaryLabel}
      </p>
      <p class="m-0 mt-0.5 text-3xl md:text-4xl font-bold tracking-tight text-text" aria-live="polite" aria-atomic="true" data-testid="primary-result">
        {props.primary}
      </p>

      {props.secondary && props.secondary.length > 0 && (
        <dl class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 m-0">
          {props.secondary.map((s) => (
            <div key={s.label} class="min-w-0">
              <dt class="text-xs text-muted">{s.label}</dt>
              <dd class="m-0 text-lg font-semibold text-text truncate" title={s.hint}>
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {props.note && <p class="m-0 mt-3 text-xs text-muted">{props.note}</p>}

      {props.steps && props.steps.length > 0 && (
        <details class="mt-3 group">
          <summary class="cursor-pointer list-none inline-flex items-center gap-1.5 min-h-10 text-sm font-medium text-accent">
            <span aria-hidden="true" class="transition-transform group-open:rotate-90">▸</span> How it's calculated
          </summary>
          <ol class="m-0 mt-2 p-0 list-none space-y-1.5 text-sm">
            {props.steps.map((s, i) => (
              <li key={i} class="grid grid-cols-[auto_1fr] gap-x-3">
                <span class="text-muted">{s.label}</span>
                <span class="font-mono text-[0.85rem] break-words">
                  {s.expression} = <strong>{s.value}</strong>
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
