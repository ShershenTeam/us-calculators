import { useEffect, useRef, useState } from 'preact/hooks';

export interface StickyResultProps {
  /** Element id of the full result card; the bar hides while it is on screen. */
  watchId: string;
  label: string;
  value: string;
  secondary?: string;
}

/**
 * Sticky bottom bar on phones for long forms: shows the headline result while the
 * user scrolls through inputs; hidden when the real result card is visible (docs/06 §3).
 */
export function StickyResult({ watchId, label, value, secondary }: StickyResultProps) {
  const [visible, setVisible] = useState(false);
  const observed = useRef<Element | null>(null);

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target || typeof IntersectionObserver === 'undefined') return;
    observed.current = target;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0.2 });
    io.observe(target);
    return () => io.disconnect();
  }, [watchId]);

  const jump = () => document.getElementById(watchId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div
      class={`md:hidden fixed inset-x-0 bottom-0 z-30 transition-transform duration-200 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        onClick={jump}
        class="ruled-top w-full flex items-center justify-between gap-3 px-4 py-3 bg-surface border-t border-accent-line/60 shadow-float text-left"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <span class="font-mono text-[0.625rem] uppercase tracking-wider text-muted max-w-[9rem] leading-tight">{label}</span>
        <span class="flex items-baseline gap-2 min-w-0">
          <span class="figure text-xl font-semibold text-text">{value}</span>
          {secondary && <span class="figure text-sm text-muted truncate">{secondary}</span>}
        </span>
      </button>
    </div>
  );
}
