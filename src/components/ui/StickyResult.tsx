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
        class="w-full flex items-center justify-between gap-3 px-4 py-3 bg-surface border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)] text-left"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <span class="text-xs text-muted">{label}</span>
        <span class="text-lg font-bold text-text">{value}</span>
        {secondary && <span class="text-sm text-muted">{secondary}</span>}
      </button>
    </div>
  );
}
