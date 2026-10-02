import type { JSX } from 'preact';

/**
 * Shape selector with drawn icons (docs/06-mobile.md §4: construction calculators pick the
 * area shape by icon). A radiogroup of ≥ 48 px buttons; 3 per row on phones, one row on desktop.
 * Shared by every area-based calculator, so the icons live here too.
 */

export type ShapeId = 'rectangle' | 'lshape' | 'circle' | 'ring' | 'triangle' | 'trapezoid' | 'area';

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 1.6,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
} as const;

/** 24×24 line icons, drawn to match the 1.6 px hairline of the design system (docs/11 §1). */
export const SHAPE_ICONS: Record<ShapeId, JSX.Element> = {
  rectangle: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="0.5" {...stroke} />
    </svg>
  ),
  lshape: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M4 4h8v9h8v7H4z" {...stroke} />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="8" {...stroke} />
      <path d="M4 12h16" {...stroke} stroke-dasharray="1.5 2" />
    </svg>
  ),
  ring: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" {...stroke} />
      <circle cx="12" cy="12" r="2.5" {...stroke} />
    </svg>
  ),
  triangle: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M3.5 19h17L9 5z" {...stroke} />
      <path d="M9 5v14" {...stroke} stroke-dasharray="1.5 2" />
    </svg>
  ),
  trapezoid: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M7.5 6h9l4 12h-17z" {...stroke} />
    </svg>
  ),
  area: (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="0.5" {...stroke} stroke-dasharray="2 2" />
      <text x="12" y="15.2" text-anchor="middle" font-size="7.5" font-family="ui-monospace, monospace" fill="currentColor">
        ft²
      </text>
    </svg>
  ),
};

export interface ShapeOption<T extends string> {
  value: T;
  label: string;
}

export interface ShapePickerProps<T extends ShapeId> {
  label: string;
  value: T;
  options: readonly ShapeOption<T>[];
  onChange: (value: T) => void;
  hideLabel?: boolean;
}

export function ShapePicker<T extends ShapeId>(props: ShapePickerProps<T>) {
  const cols =
    props.options.length > 6
      ? 'grid-cols-4 sm:grid-cols-7'
      : props.options.length > 4
        ? 'grid-cols-3 sm:grid-cols-6'
        : 'grid-cols-4';
  return (
    <div class="flex flex-col gap-1.5 min-w-0">
      <span class={props.hideLabel ? 'sr-only' : 'text-[0.8125rem] font-semibold text-text'}>{props.label}</span>
      <div role="radiogroup" aria-label={props.label} class={`grid ${cols} gap-1.5`}>
        {props.options.map((o) => {
          const active = o.value === props.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => props.onChange(o.value)}
              class={`min-h-14 min-w-0 rounded-field border px-1 py-1.5 flex flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold leading-none transition duration-150 ${
                active
                  ? 'border-accent bg-surface text-accent shadow-card'
                  : 'border-border bg-surface/60 text-muted hover:text-text hover:border-accent-line'
              }`}
            >
              {SHAPE_ICONS[o.value]}
              <span class="truncate max-w-full">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
