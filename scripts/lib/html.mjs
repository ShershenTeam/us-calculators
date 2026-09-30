// Shared helpers for scripts that inspect the built site in dist/.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'node-html-parser';

export const DIST = path.resolve(process.cwd(), 'dist');

/** All HTML files under dist/, as { file, url, html, root }. */
export async function loadPages() {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'pagefind' || entry.name === '_astro') continue;
        await walk(full);
      } else if (entry.name.endsWith('.html')) {
        files.push(full);
      }
    }
  }
  await walk(DIST);
  const pages = [];
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    pages.push({ file, url: fileToUrl(file), html, root: parse(html) });
  }
  return pages.sort((a, b) => a.url.localeCompare(b.url));
}

export function fileToUrl(file) {
  const rel = path.relative(DIST, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

export async function loadManifest() {
  try {
    return JSON.parse(await readFile(path.join(DIST, 'registry.json'), 'utf8'));
  } catch {
    return [];
  }
}

export async function fileSize(rel) {
  try {
    return (await stat(path.join(DIST, rel))).size;
  } catch {
    return 0;
  }
}

export function text(node) {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Minimal reporter: collects errors/warnings and prints a table. */
export class Report {
  constructor(name) {
    this.name = name;
    this.errors = [];
    this.warnings = [];
  }
  error(url, rule, detail) {
    this.errors.push({ url, rule, detail });
  }
  warn(url, rule, detail) {
    this.warnings.push({ url, rule, detail });
  }
  print() {
    const fmt = (rows, label) => {
      if (!rows.length) return;
      console.log(`\n${label} (${rows.length})`);
      for (const r of rows) console.log(`  ${r.url}  [${r.rule}]  ${r.detail}`);
    };
    fmt(this.errors, 'ERRORS');
    fmt(this.warnings, 'WARNINGS');
    console.log(`\n${this.name}: ${this.errors.length} error(s), ${this.warnings.length} warning(s)`);
  }
  exit() {
    this.print();
    process.exit(this.errors.length ? 1 : 0);
  }
}
