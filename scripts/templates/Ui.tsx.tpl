import { useMemo, useState } from 'preact/hooks';
import { NumberInput, ResultCard, CopyButton, ShareButton, PrintButton } from '@/components/ui';
import { fmt } from '@/lib/format';
import { calculate, DEFAULT_INPUT } from './logic';

/** {{name}} island. Server-rendered with DEFAULT_INPUT, hydrated on load. */
export default function {{island}}() {
  const [input, setInput] = useState(DEFAULT_INPUT);
  const result = useMemo(() => calculate(input), [input]);

  return (
    <div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] md:items-start">
      <form class="grid gap-4" onSubmit={(e) => e.preventDefault()} aria-label="{{name}} inputs">
        <NumberInput label="Value" value={input.value} onChange={(value) => setInput((s) => ({ ...s, value }))} />
      </form>
      <ResultCard
        id="{{id}}-result"
        primaryLabel="Result"
        primary={fmt(result.result, 2)}
        steps={result.steps}
        actions={
          <>
            <CopyButton text={`Result: ${fmt(result.result, 2)}`} />
            <ShareButton url={typeof window !== 'undefined' ? window.location.href : ''} title="{{name}}" />
            <PrintButton />
          </>
        }
      />
    </div>
  );
}
