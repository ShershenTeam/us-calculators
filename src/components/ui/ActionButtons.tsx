import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

const base =
  'inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-field border border-border bg-surface text-[0.8125rem] font-semibold text-text transition duration-150 hover:border-accent hover:text-accent hover:shadow-card disabled:opacity-50';

function Btn({ onClick, children, label }: { onClick: () => void; children: ComponentChildren; label?: string }) {
  return (
    <button type="button" class={base} onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Copies a plain-text summary of the result. */
export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const click = async () => {
    setState((await copyText(text)) ? 'ok' : 'fail');
    setTimeout(() => setState('idle'), 1800);
  };
  return (
    <Btn onClick={click} label="Copy result">
      <span aria-hidden="true">⧉</span> {state === 'ok' ? 'Copied' : state === 'fail' ? 'Copy failed' : 'Copy'}
    </Btn>
  );
}

/** Web Share API with clipboard fallback; `url` already contains the calculator state. */
export function ShareButton({ url, title }: { url: string; title: string }) {
  const [state, setState] = useState<'idle' | 'ok'>('idle');
  const click = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled or unsupported — fall through to copy */
      }
    }
    if (await copyText(url)) {
      setState('ok');
      setTimeout(() => setState('idle'), 1800);
    }
  };
  return (
    <Btn onClick={click} label="Share a link to this result">
      <span aria-hidden="true">↗</span> {state === 'ok' ? 'Link copied' : 'Share'}
    </Btn>
  );
}

export function PrintButton() {
  return (
    <Btn onClick={() => window.print()} label="Print this result">
      <span aria-hidden="true">⎙</span> Print
    </Btn>
  );
}

/** Downloads `rows` as a CSV file. */
export function CsvButton({ filename, rows }: { filename: string; rows: (string | number)[][] }) {
  const click = () => {
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = rows.map((r) => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  };
  return (
    <Btn onClick={click} label="Download as CSV">
      <span aria-hidden="true">⤓</span> CSV
    </Btn>
  );
}
