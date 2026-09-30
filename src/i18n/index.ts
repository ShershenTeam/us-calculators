import en from './en.json';
import es from './es.json';
import type { Locale } from '@/lib/define-calculator';

const dict: Record<Locale, Record<string, string>> = { en, es };

export function t(locale: Locale, key: keyof typeof en, vars: Record<string, string> = {}): string {
  const s = dict[locale][key] ?? dict.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}
