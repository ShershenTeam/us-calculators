export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Optional small icon (inline SVG string is fine). */
  icon?: preact.JSX.Element;
}

export interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  /** Visually hide the label (still read by screen readers). */
  hideLabel?: boolean;
  size?: 'sm' | 'md';
}

/** Segmented control for 2–4 options (`ft | m`, `AM | PM`) — replaces dropdowns on mobile (docs/06 §2). */
export function Segmented<T extends string>(props: SegmentedProps<T>) {
  const h = props.size === 'sm' ? 'h-10' : 'h-12';
  return (
    <div class="flex flex-col gap-1.5">
      <span class={props.hideLabel ? 'sr-only' : 'text-[0.8125rem] font-semibold text-text'}>{props.label}</span>
      <div
        role="radiogroup"
        aria-label={props.label}
        class={`inline-flex max-w-full min-w-0 ${h} rounded-field border border-border bg-surface-2 p-[3px]`}
      >
        {props.options.map((o) => {
          const active = o.value === props.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => props.onChange(o.value)}
              class={`flex-1 min-w-0 px-2 sm:px-3 rounded-[0.3rem] text-[0.8125rem] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition duration-150 ${
                active ? 'bg-surface text-accent shadow-card' : 'text-muted hover:text-text'
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
