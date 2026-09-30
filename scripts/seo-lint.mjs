// SEO lint over dist/ — rules from docs/07-seo-checklist.md "Що з цього автоматизуємо".
// Exit 1 on any error. Run after `npm run build`.
import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadPages, loadManifest, text, Report, DIST } from './lib/html.mjs';

const JS_BUDGET_GZIP = 50 * 1024;
const NOINDEX_ALLOWED = new Set(['/404.html', '/search/']);

const report = new Report('seo-lint');
const pages = await loadPages();
const manifest = await loadManifest();
const calculatorUrls = new Set(manifest.filter((m) => m.status === 'published').map((m) => m.url));

const seenTitles = new Map();
const seenDescriptions = new Map();
const seenH1 = new Map();

for (const p of pages) {
  const { url, root } = p;
  const isCalc = calculatorUrls.has(url);
  const head = root.querySelector('head');
  const html = root.querySelector('html');

  // 1. title / description / H1 lengths, uniqueness, heading hierarchy
  const title = text(head?.querySelector('title'));
  if (!title) report.error(url, 'title', 'missing');
  else {
    if (title.length > 60) report.error(url, 'title', `${title.length} chars > 60`);
    if (seenTitles.has(title)) report.error(url, 'title', `duplicate of ${seenTitles.get(title)}`);
    seenTitles.set(title, url);
  }
  const desc = head?.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  if (desc.length < 120 || desc.length > 155) report.error(url, 'description', `${desc.length} chars (need 120–155)`);
  if (seenDescriptions.has(desc)) report.error(url, 'description', `duplicate of ${seenDescriptions.get(desc)}`);
  seenDescriptions.set(desc, url);

  const h1s = root.querySelectorAll('h1');
  if (h1s.length !== 1) report.error(url, 'h1', `${h1s.length} H1 elements (need exactly 1)`);
  else {
    const h1 = text(h1s[0]);
    if (seenH1.has(h1)) report.error(url, 'h1', `duplicate of ${seenH1.get(h1)}`);
    seenH1.set(h1, url);
  }
  const headings = root.querySelectorAll('h1,h2,h3,h4,h5,h6').map((h) => Number(h.tagName[1]));
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      report.warn(url, 'heading-order', `h${headings[i - 1]} followed by h${headings[i]}`);
      break;
    }
  }

  // 2. canonical, lang, noindex
  const canonical = head?.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
  if (!canonical) report.error(url, 'canonical', 'missing');
  else {
    if (canonical.includes('?')) report.error(url, 'canonical', 'contains query string');
    if (!canonical.endsWith('/') && !canonical.endsWith('.html')) report.error(url, 'canonical', 'no trailing slash');
    if (!NOINDEX_ALLOWED.has(url) && url !== '/404.html' && !canonical.endsWith(url)) report.error(url, 'canonical', `points to ${canonical}`);
  }
  const lang = html?.getAttribute('lang') ?? '';
  if (!/^(en|es)-US$/.test(lang)) report.error(url, 'lang', `"${lang}"`);
  const robots = head?.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
  if (/noindex/.test(robots) && !NOINDEX_ALLOWED.has(url)) report.error(url, 'noindex', 'unexpected noindex');
  if (!/noindex/.test(robots) && NOINDEX_ALLOWED.has(url)) report.error(url, 'noindex', 'should be noindex');

  // hreflang reciprocity handled by registry; check x-default present when any alternate exists
  const alternates = head?.querySelectorAll('link[rel="alternate"][hreflang]') ?? [];
  if (alternates.length && !alternates.some((a) => a.getAttribute('hreflang') === 'x-default')) {
    report.error(url, 'hreflang', 'alternates without x-default');
  }

  // OG
  for (const prop of ['og:title', 'og:description', 'og:image', 'og:url']) {
    if (!head?.querySelector(`meta[property="${prop}"]`)) report.error(url, 'open-graph', `missing ${prop}`);
  }

  // 3. JSON-LD validity
  const ldBlocks = root.querySelectorAll('script[type="application/ld+json"]');
  const ldTypes = new Set();
  for (const s of ldBlocks) {
    try {
      const data = JSON.parse(s.textContent);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (!item['@type']) report.error(url, 'json-ld', 'block without @type');
        ldTypes.add(item['@type']);
        if (item['@type'] === 'FAQPage' && !(item.mainEntity?.length >= (isCalc ? 4 : 3))) {
          report.error(url, 'json-ld', `FAQPage with < ${isCalc ? 4 : 3} questions`);
        }
        if (item['@type'] === 'BreadcrumbList' && !(item.itemListElement?.length >= 2)) report.error(url, 'json-ld', 'BreadcrumbList too short');
      }
    } catch (e) {
      report.error(url, 'json-ld', `invalid JSON: ${e.message}`);
    }
  }
  if (url !== '/' && !NOINDEX_ALLOWED.has(url) && !ldTypes.has('BreadcrumbList')) report.error(url, 'json-ld', 'missing BreadcrumbList');
  if (url === '/' && !(ldTypes.has('Organization') && ldTypes.has('WebSite'))) report.error(url, 'json-ld', 'home needs Organization + WebSite');

  // 6. images
  for (const img of root.querySelectorAll('img')) {
    if (img.getAttribute('alt') == null) report.error(url, 'img-alt', img.getAttribute('src') ?? '(inline)');
    if (!img.getAttribute('width') || !img.getAttribute('height')) report.warn(url, 'img-size', `${img.getAttribute('src')} without width/height`);
  }

  // Calculator-specific (docs/07 B3–B6)
  if (isCalc) {
    for (const t of ['WebApplication', 'FAQPage']) if (!ldTypes.has(t)) report.error(url, 'json-ld', `calculator page missing ${t}`);
    const faqCount = root.querySelectorAll('details summary h3').length;
    if (faqCount < 4) report.error(url, 'faq', `${faqCount} visible FAQ items (need ≥ 4)`);
    if (!root.querySelector('[data-calculator]')) report.error(url, 'calculator', 'no [data-calculator] block');
    if (!root.querySelector('[data-testid="primary-result"]')) report.error(url, 'ssr', 'default result not server-rendered');
    if (!root.querySelector('[data-calculator] input')) report.error(url, 'ssr', 'inputs not server-rendered');
    for (const input of root.querySelectorAll('[data-calculator] input')) {
      const id = input.getAttribute('id');
      if (!id || !root.querySelector(`label[for="${id}"]`)) report.error(url, 'a11y', `input without <label for>: ${id ?? '(no id)'}`);
    }
    if (!root.querySelector('a[href="/methodology/"]')) report.warn(url, 'trust', 'no link to methodology');
    if (!/Last updated/.test(p.html)) report.error(url, 'trust', 'missing "Last updated"');
    if (!/Written by/.test(p.html)) report.error(url, 'trust', 'missing author');
    const sourcesCount = root.querySelectorAll('footer ol li a').length;
    if (sourcesCount < 1) report.error(url, 'sources', 'no sources listed');
    const words = text(root.querySelector('.prose')).split(' ').filter(Boolean).length;
    if (words < 400) report.warn(url, 'word-count', `${words} words (< 400)`);
    if (words > 1800) report.warn(url, 'word-count', `${words} words (> 1800)`);
    const contextual = root.querySelectorAll('.prose a[href^="/"]').length;
    const drafts = root.querySelectorAll('.prose [data-calc-draft]').length;
    if (contextual < 3) {
      const msg = `${contextual} contextual <Calc> links (need ≥ 3)${drafts ? `; ${drafts} point to drafts` : ''}`;
      if (drafts && contextual + drafts >= 3) report.warn(url, 'internal-links', msg);
      else report.error(url, 'internal-links', msg);
    }
    for (const a of root.querySelectorAll('.prose a')) {
      if (/^(click here|here|read more|link)$/i.test(text(a))) report.warn(url, 'anchor', `generic anchor "${text(a)}"`);
    }

    // JS budget (gzip) — sum of module scripts referenced by the page
    let bytes = 0;
    for (const s of root.querySelectorAll('script[type="module"][src]')) {
      const src = s.getAttribute('src');
      if (!src?.startsWith('/')) continue;
      try {
        bytes += gzipSync(await readFile(path.join(DIST, src))).length;
      } catch {
        report.error(url, 'js', `script not found: ${src}`);
      }
    }
    // Astro island chunks are loaded dynamically; include every _astro/*.js the page references in HTML.
    const chunkRefs = [...p.html.matchAll(/\/_astro\/[\w.-]+\.js/g)].map((m) => m[0]);
    for (const ref of new Set(chunkRefs)) {
      try {
        bytes += gzipSync(await readFile(path.join(DIST, ref))).length;
      } catch {
        /* counted above or absent */
      }
    }
    if (bytes > JS_BUDGET_GZIP) report.error(url, 'js-budget', `${(bytes / 1024).toFixed(1)} KB gzip > 50 KB`);
    else console.log(`  js ${url}: ${(bytes / 1024).toFixed(1)} KB gzip`);
  }
}

// 7. primary keyword uniqueness (registry manifest)
const kw = new Map();
for (const m of manifest) {
  const k = m.primaryKeyword.toLowerCase();
  if (kw.has(k) && kw.get(k) !== m.id) report.error(m.url, 'cannibalisation', `primary keyword "${m.primaryKeyword}" also used by ${kw.get(k)}`);
  kw.set(k, m.id);
}

// Every published calculator must have a built page
for (const m of manifest.filter((m) => m.status === 'published')) {
  if (!pages.some((p) => p.url === m.url)) report.error(m.url, 'missing-page', 'published in registry but not built');
}

console.log(`seo-lint: checked ${pages.length} pages, ${calculatorUrls.size} calculators`);
report.exit();
