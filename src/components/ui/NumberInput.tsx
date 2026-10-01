import { useId, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { parseNumber, parseFeet } from '@/lib/parse-input';

export interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Unit shown as a suffix inside the field: "ft", "in", "%". */
  unit?: string;
  /** Accept 3'6" style feet-and-inches input. */
  feet?: boolean;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  /** Extra explanation under the label. */
  hint?: string;
  /** Validation message to show; undefined = valid. */
  error?: string;
  /** Warning (non-blocking). */
  warning?: string;
  id?: string;
  compact?: boolean;
  /** Show +/- steppers (mobile-friendly for small integers). */
  steppers?: boolean;
}

/**
 * Numeric field with the right mobile keyboard, forgiving parsing ("1,250", "3'6\""),
 * visible label, ≥ 48 px touch target and text error message (docs/06 §2, §7).
 * Keeps the raw text while typing so "1." or "" does not snap back to a number.
 */
export function NumberInput(props: NumberInputProps) {
  const autoId = useId();
  const id = props.id ?? autoId;
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? (Number.isFinite(props.value) ? String(props.value) : '');
  const invalid = Boolean(props.error);

  const commit = (raw: string) => {
    const n = props.feet ? parseFeet(raw) : parseNumber(raw);
    props.onChange(Number.isNaN(n) ? NaN : props.integer ? Math.round(n) : n);
  };

  const onInput = (e: JSX.TargetedInputEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    setText(raw);
    commit(raw);
  };

  const onBlur = () => setText(null);

  const stepBy = (d: number) => {
    const base = Number.isFinite(props.value) ? props.value : 0;
    let next = base + d * (props.step ?? 1);
    if (props.min != null) next = Math.max(props.min, next);
    if (props.max != null) next = Math.min(props.max, next);
    setText(null);
    props.onChange(props.integer ? Math.round(next) : Number(next.toFixed(6)));
  };

  return (
    <div class={`flex flex-col min-w-0 ${props.compact ? 'gap-0.5' : 'gap-1.5'}`}>
      <label for={id} class="text-[0.8125rem] font-semibold text-text leading-tight">
        {props.label}
      </label>
      {props.hint && (
        <span id={`${id}-hint`} class="text-[0.6875rem] leading-snug text-muted -mt-1">
          {props.hint}
        </span>
      )}
      <div class="flex items-stretch">
        {props.steppers && (
          <button
            type="button"
            class="min-w-12 rounded-l-field border border-border bg-surface-2 text-lg text-muted hover:bg-border hover:text-text transition-colors"
            onClick={() => stepBy(-1)}
          >
            <span aria-hidden="true">−</span>
            <span class="sr-only">Decrease {props.label}</span>
          </button>
        )}
        <div class="relative flex-1 min-w-0">
          <input
            id={id}
            type="text"
            inputMode={props.integer ? 'numeric' : 'decimal'}
            autoComplete="off"
            value={shown}
            onInput={onInput}
            onBlur={onBlur}
            aria-invalid={invalid || undefined}
            aria-describedby={[props.hint ? `${id}-hint` : '', props.error || props.warning ? `${id}-msg` : ''].filter(Boolean).join(' ') || undefined}
            class={`w-full h-12 px-3 font-medium ${props.unit ? 'pr-11' : ''} ${
              props.steppers ? 'rounded-none' : 'rounded-field'
            } border ${
              invalid ? 'border-error bg-error/5' : 'border-border bg-surface'
            } text-text text-base outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15`}
          />
          {props.unit && (
            <span
              aria-hidden="true"
              class="absolute right-0 top-1/2 -translate-y-1/2 h-[calc(100%-0.75rem)] grid place-items-center px-2.5 text-[0.75rem] font-mono text-muted border-l border-border pointer-events-none"
            >
              {props.unit}
            </span>
          )}
        </div>
        {props.steppers && (
          <button
            type="button"
            class="min-w-12 rounded-r-field border border-border bg-surface-2 text-lg text-muted hover:bg-border hover:text-text transition-colors"
            onClick={() => stepBy(1)}
          >
            <span aria-hidden="true">+</span>
            <span class="sr-only">Increase {props.label}</span>
          </button>
        )}
      </div>
      {(props.error || props.warning) && (
        <p
          id={`${id}-msg`}
          class={`text-[0.6875rem] leading-snug m-0 ${props.error ? 'text-error font-medium' : 'text-warn'}`}
          role={props.error ? 'alert' : undefined}
        >
          {props.error ?? props.warning}
        </p>
      )}
    </div>
  );
}
