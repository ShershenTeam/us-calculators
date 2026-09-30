// `npm run new <id> [--slug <slug>] [--name "Display Name"] [--category <id>]`
// Scaffolds src/calculators/<id>/ and src/content/calculators/en/<slug>.mdx from scripts/templates/.
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
if (!id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  console.error('Usage: npm run new <id> [--slug <slug>] [--name "Name"] [--category <categoryId>]\n  id: lowercase, hyphens, e.g. "mulch"');
  process.exit(1);
}
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const slug = opt('slug', `${id}-calculator`);
const name = opt('name', `${id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')} Calculator`);
const category = opt('category', 'construction');
const pascal = id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const island = `${pascal}Calculator`;
const today = new Date().toISOString().slice(0, 10);

const root = process.cwd();
const calcDir = path.join(root, 'src', 'calculators', id);
const mdxPath = path.join(root, 'src', 'content', 'calculators', 'en', `${slug}.mdx`);
const briefPath = path.join(root, 'docs', 'briefs', `${slug}.md`);

try {
  await access(calcDir);
  console.error(`Already exists: ${path.relative(root, calcDir)}`);
  process.exit(1);
} catch {
  /* ok */
}

const vars = { id, slug, name, category, island, today, primaryKeyword: name.toLowerCase() };
const render = (tpl) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
const tplDir = path.join(root, 'scripts', 'templates');
const files = [
  ['meta.ts.tpl', path.join(calcDir, 'meta.ts')],
  ['logic.ts.tpl', path.join(calcDir, 'logic.ts')],
  ['logic.test.ts.tpl', path.join(calcDir, 'logic.test.ts')],
  ['Ui.tsx.tpl', path.join(calcDir, `${island}.tsx`)],
  ['island.astro.tpl', path.join(calcDir, 'island.astro')],
  ['page.mdx.tpl', mdxPath],
];

await mkdir(calcDir, { recursive: true });
await mkdir(path.dirname(mdxPath), { recursive: true });
for (const [tpl, out] of files) {
  const content = render(await readFile(path.join(tplDir, tpl), 'utf8'));
  await writeFile(out, content, 'utf8');
  console.log(`created ${path.relative(root, out)}`);
}

try {
  await access(briefPath);
} catch {
  const brief = (await readFile(path.join(root, 'docs', 'templates', 'page-brief.md'), 'utf8')).replace('<назва>', name);
  await mkdir(path.dirname(briefPath), { recursive: true });
  await writeFile(briefPath, brief, 'utf8');
  console.log(`created ${path.relative(root, briefPath)}  ← fill this first (Constitution I)`);
}

console.log(`\nNext: fill docs/briefs/${slug}.md → logic.ts + tests → ${island}.tsx → ${slug}.mdx → set status.en = 'published' in meta.ts`);
