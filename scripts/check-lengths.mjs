// Quick authoring helper: title/description lengths in content and page sources (pre-build).
import { readdirSync, readFileSync } from 'node:fs';

const files = [
  ...readdirSync('src/content/categories/en').map((f) => `src/content/categories/en/${f}`),
  ...readdirSync('src/content/calculators/en').map((f) => `src/content/calculators/en/${f}`),
  ...readdirSync('src/pages').filter((f) => f.endsWith('.astro')).map((f) => `src/pages/${f}`),
];

let bad = 0;
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  const d = /^description:\s*"([^"]+)"/m.exec(s) ?? /const description\s*=\s*\n?\s*['"`]([^'"`]+)['"`]/s.exec(s);
  const t = /^title:\s*"([^"]+)"/m.exec(s);
  if (d) {
    const len = d[1].trim().length;
    const flag = len < 120 || len > 155 ? '  <<< FIX (120–155)' : '';
    if (flag) bad++;
    console.log(`${f.padEnd(55)} desc  ${String(len).padStart(3)}${flag}`);
  }
  if (t) {
    const len = t[1].length;
    const flag = len > 60 ? '  <<< FIX (≤ 60)' : '';
    if (flag) bad++;
    console.log(`${f.padEnd(55)} title ${String(len).padStart(3)}${flag}`);
  }
}
process.exit(bad ? 1 : 0);
