// Internal link report over dist/: orphans, pages with < 3 inbound links, broken links.
// Header/footer links count as inbound but are reported separately so "orphan" means
// "reachable only from global navigation". Exit 1 on broken links or true orphans.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadPages, loadManifest, Report, DIST } from './lib/html.mjs';

const report = new Report('link-report');
const pages = await loadPages();
const manifest = await loadManifest();
const urls = new Set(pages.map((p) => p.url));
const SKIP = new Set(['/404.html', '/search/']);

const inbound = new Map(); // url -> { nav: Set, body: Set }
for (const u of urls) inbound.set(u, { nav: new Set(), body: new Set() });

function normalize(href) {
  if (!href || href.startsWith('#') || /^(mailto|tel|http|https):/.test(href)) return null;
  let u = href.split('#')[0].split('?')[0];
  if (!u.startsWith('/')) return null;
  if (!u.endsWith('/') && !/\.[a-z0-9]+$/i.test(u)) u += '/';
  return u;
}

function targetExists(u) {
  if (urls.has(u)) return true;
  const rel = u.replace(/^\//, '');
  return existsSync(path.join(DIST, rel)) || existsSync(path.join(DIST, rel, 'index.html'));
}

for (const p of pages) {
  const anchors = p.root.querySelectorAll('a[href]');
  for (const a of anchors) {
    const u = normalize(a.getAttribute('href'));
    if (!u) continue;
    if (!targetExists(u)) {
      report.error(p.url, 'broken', `→ ${u} ("${a.textContent.trim().slice(0, 40)}")`);
      continue;
    }
    const inNav = Boolean(a.closest('header') || a.closest('footer'));
    const rec = inbound.get(u);
    if (rec && u !== p.url) (inNav ? rec.nav : rec.body).add(p.url);
  }
}

const rows = [];
for (const [u, rec] of inbound) {
  if (SKIP.has(u)) continue;
  const total = rec.nav.size + rec.body.size;
  rows.push({ url: u, nav: rec.nav.size, body: rec.body.size, total });
  if (u === '/') continue;
  if (total === 0) report.error(u, 'orphan', 'no inbound links at all');
  else if (rec.body.size === 0) {
    const isCalc = manifest.some((m) => m.url === u && m.status === 'published');
    (isCalc ? report.error : report.warn).call(report, u, 'nav-only', 'linked only from header/footer');
  }
  if (total < 3) report.warn(u, 'few-inbound', `${total} inbound link(s) (< 3)`);
}

rows.sort((a, b) => a.total - b.total);
console.log('inbound links per page (nav / body / total):');
for (const r of rows) console.log(`  ${String(r.total).padStart(3)}  ${String(r.nav).padStart(3)} / ${String(r.body).padStart(3)}  ${r.url}`);
report.exit();
