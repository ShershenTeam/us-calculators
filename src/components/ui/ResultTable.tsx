export interface ResultTableProps {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
  /** Hide the caption visually (keep for a11y). */
  hideCaption?: boolean;
  compact?: boolean;
}

/** Small results table that scrolls inside its box on narrow screens (docs/06 §1). */
export function ResultTable({ caption, columns, rows, hideCaption, compact }: ResultTableProps) {
  const pad = compact ? 'py-1.5 px-2.5' : 'py-2 px-3';
  return (
    <div class="overflow-x-auto rounded-card border border-border bg-surface">
      <table class={`min-w-full ${compact ? 'text-sm' : ''}`}>
        <caption
          class={hideCaption ? 'sr-only' : 'text-left px-3 pt-3 pb-2 font-mono text-[0.6875rem] uppercase tracking-wider text-muted'}
        >
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col" class={`${pad} whitespace-nowrap`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} class="last:[&>td]:border-b-0">
              {r.map((cell, j) => (
                <td key={j} class={`${pad} whitespace-nowrap ${j === 0 ? 'font-semibold' : 'figure'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
