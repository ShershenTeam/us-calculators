// Builds a map of URL → last real content change (ISO date) for the sitemap.
// docs/07 A1: lastmod must reflect content changes, not the build time.
// Sources: `updated:` in content frontmatter and `updated={new Date('YYYY-MM-DD')}` in service pages.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const DATE_RE = /\b(\d{4}-\d{2}-\d{2})\b/;

function frontmatterDate(file) {
  const src = readFileSync(file, 'utf8');
  const m = /^updated:\s*(.+)$/m.exec(src);
  const d = m && DATE_RE.exec(m[1]);
  return d ? d[1] : undefined;
}

function pageDate(file) {
  const src = readFileSync(file, 'utf8');
  const m = /updated=\{new Date\('(\d{4}-\d{2}-\d{2})'\)\}/.exec(src);
  return m ? m[1] : undefined;
}

export function buildLastmodMap(root = process.cwd()) {
  const map = new Map();
  const add = (url, date) => {
    if (!date) return;
    const prev = map.get(url);
    if (!prev || date > prev) map.set(url, date);
  };

  const calcDir = path.join(root, 'src/content/calculators');
  if (existsSync(calcDir)) {
    for (const locale of readdirSync(calcDir)) {
      const dir = path.join(calcDir, locale);
      for (const f of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
        const slug = f.replace(/\.mdx$/, '');
        add(locale === 'en' ? `/${slug}/` : `/${locale}/${slug}/`, frontmatterDate(path.join(dir, f)));
      }
    }
  }

  const catDir = path.join(root, 'src/content/categories');
  if (existsSync(catDir)) {
    for (const locale of readdirSync(catDir)) {
      const dir = path.join(catDir, locale);
      for (const f of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
        const slug = f.replace(/\.mdx$/, '');
        add(locale === 'en' ? `/${slug}/` : `/${locale}/${slug}/`, frontmatterDate(path.join(dir, f)));
      }
    }
  }

  const pagesDir = path.join(root, 'src/pages');
  for (const f of readdirSync(pagesDir).filter((f) => f.endsWith('.astro') && !f.startsWith('['))) {
    const name = f.replace(/\.astro$/, '');
    add(name === 'index' ? '/' : `/${name}/`, pageDate(path.join(pagesDir, f)));
  }

  // Home and hubs change whenever anything inside them changes.
  let latest;
  for (const d of map.values()) if (!latest || d > latest) latest = d;
  add('/', latest);
  return map;
}
