# Research: Site Skeleton + Gravel Calculator Pilot

**Date**: 2026-09-30 · Feeds `plan.md`. All unknowns from the spec are resolved here.

## 1. Stack versions (npm registry, 2026-09-30)

| Package | Version | Decision / note |
|---|---|---|
| astro | 7.3.5 | Static output default. `trailingSlash: 'always'`, `build.format: 'directory'`. Content layer with `glob` loader and `render()` from `astro:content`. |
| @astrojs/preact | 6.0.5 | Peer `preact ^10.6.5` → **Preact 10.29.8**, not Preact 11 (peer mismatch). |
| @astrojs/mdx | 8.0.2 | Peer `astro ^7.2.10`. Components passed via `<Content components={{...}} />`. |
| @astrojs/sitemap | 3.7.4 | `i18n: { defaultLocale: 'en', locales: { en: 'en-US', es: 'es-US' } }` for `xhtml:link`. |
| @astrojs/check | 0.9.10 | `astro check` (needs `typescript`). |
| tailwindcss + @tailwindcss/vite | 4.3.3 | CSS-first: `@import "tailwindcss"; @theme { … }`; plugin in `vite.plugins`. No `tailwind.config`. |
| vitest | 5.0.3 | `getViteConfig()` from `astro/config` in `vitest.config.ts`. Peer vite ^8 OK (Astro 7 ships Vite 8). |
| @playwright/test | 1.63.0 | Devices `iPhone SE`, `Pixel 7`; `webServer` runs `astro preview`. |
| pagefind | 1.5.2 | Post-build CLI `pagefind --site dist`; UI via `/pagefind/pagefind-ui.js` loaded lazily. |
| zod | via `astro/zod` | Use Astro's re-export to avoid dual versions. |
| satori 0.33.5 + sharp 0.35.5 | OG images at build (Node script or Astro endpoint). Font: `@fontsource/inter` `.woff` (satori supports woff/ttf/otf, not woff2). |
| typescript | 7.0.2 | `astro/tsconfigs/strict`. |

## 2. Repository layout decision

The `Calculator/` folder (already a git repo via spec-kit) becomes the site repository root; `docs/`, `research/`, `CLAUDE.md`, `HANDOFF.md`, `README.md`, `Page_Plan_12_months.xlsx` stay at root as `docs/04-tech-and-deploy.md` §2 shows. Astro files (`package.json`, `astro.config.mjs`, `src/`, `public/`, `scripts/`) are added at root. Rationale: one repo, one CI, docs versioned with code. `npm create astro` refuses non-empty dirs, so the scaffold is written directly (files are small and fully specified in plan).

## 3. Registry design

- `src/calculators/<id>/meta.ts` exports `defineCalculator({...})` result. `defineCalculator` is an identity function with a typed contract (`CalculatorMeta`).
- `src/registry.ts` uses `import.meta.glob('./calculators/*/meta.ts', { eager: true })` (Vite) to collect metas at build time; validation throws (fails build) on: duplicate `id`, duplicate `slugs.en`, duplicate `primaryKeyword`, unknown `category`/`alsoIn`, unknown `related`/`next` ids. Related links are symmetrised into `relatedResolved`.
- `scripts/*.mjs` cannot import Vite globs; they read `dist/` HTML instead (seo-lint, link-report) or the filesystem (new-calculator). Registry validation therefore runs inside `astro build`, where `[slug].astro`'s `getStaticPaths` imports the registry.
- `<Calc slug>` component looks up the registry at render time and throws → build fails on unknown slug (Constitution III).
- Categories: `src/data/categories.ts` (10 entries from `docs/03` §1, with `order`, `shortName`, `subgroups`). Hub intro text lives in `src/content/categories/en/<slug>.mdx`.

## 4. Content collections

`src/content.config.ts`:
- `calculators`: glob `src/content/calculators/{en,es}/*.mdx`; id = `<locale>/<slug>`. Schema: `calculatorId`, `locale`, `title` ≤ 60, `description` 120–155, `h1`, `intro`, `faq` ≥ 4 `{q,a}`, `sources` ≥ 1 `{name,url,date?}`, `author`, `reviewer?`, `updated` (date), `ymyl` default false with `superRefine` requiring `reviewer` when true, `wordsHint?`.
- `categories`: glob `src/content/categories/{en,es}/*.mdx`; `title`, `description`, `h1`, `intro`, `faq` ≥ 3.
- `authors`: glob `src/content/authors/*.md`; `name`, `role`, `credentials?`, `bio`, `sameAs[]`.
- `guides`: defined, empty for now.

## 5. Pilot: gravel data (from `docs/briefs/gravel-calculator.md`)

Gravel types (lb/ft³, tons/yd³ = lb/ft³ × 27 ÷ 2000):

| id | label | lb/ft³ | t/yd³ | source |
|---|---|---|---|---|
| crushed-stone | Crushed stone (#57) | 105 | 1.42 | supplier practice; DOT spec 81–92 dry |
| pea-gravel | Pea gravel | 100 | 1.35 | calculatorsoup 2 565 lb/yd³ ≈ 95; inchcalculator 1.25–1.5 → 100 |
| river-rock | River rock | 105 | 1.42 | calculatorsoup 2 835 lb/yd³ |
| crusher-run | Crusher run / #411 | 111 | 1.50 | supplier 3 000 lb/yd³ |
| dense-graded | Dense graded base (DGA) | 125 | 1.69 | calculatorsoup 3 374 lb/yd³ |
| bank-run | Bank run gravel | 120 | 1.62 | calculatorsoup 3 240 lb/yd³ |
| decomposed-granite | Decomposed granite | 103 | 1.39 | calculatorsoup 2 781 lb/yd³ |
| marble-chips | Marble chips | 95 | 1.28 | calculatorsoup 2 565 lb/yd³ |
| lava-rock | Lava rock | 52 | 0.70 | calculatorsoup 1 391 lb/yd³ |
| riprap | Riprap | 100 | 1.35 | calculatorsoup 2 700 lb/yd³ |
| custom | Custom density | user | — | — |

Exact unit factors (NIST SP 811): `FT = 0.3048 m`, `YD3_TO_M3 = 0.764554857984`, `LB_TO_KG = 0.45359237`, `SHORT_TON_LB = 2000`, `IN_PER_FT = 12`, `FT3_PER_YD3 = 27`.

## 6. Quality scripts approach

- **seo-lint** (`dist/**/*.html`): parse with `node-html-parser`; rules per `docs/07` §"Що автоматизуємо" items 1–4, 6, 7 (7 via registry manifest `dist/_registry.json` emitted at build). Exit 1 on error, print table.
- **link-report**: build graph of internal `<a href>` across `dist/`; report orphans (0 inbound excluding nav/footer? → count all links but flag pages whose only inbound are header/footer), < 3 inbound, broken (target file missing). Exit 1 on orphans or broken.
- **Playwright**: `tests/e2e/calculator.spec.ts` iterates `dist/_registry.json` published slugs; asserts above-the-fold, result change, no horizontal scroll; screenshots to `test-results/`.
- **Lighthouse**: documented command (`npx lighthouse --preset=perf --form-factor=mobile`) for stage D; not automated in this feature.

## 7. Decisions on open items

- Domain/brand unknown → `SITE_URL` env (default `https://example.com`), `src/data/site.ts` holds `name: 'Calc Site'` and `TODO` markers.
- Dark mode: CSS `prefers-color-scheme` + tokens; no toggle UI in this feature.
- Ads: `AdSlot` renders a reserved 250 px (mobile) / 280 px box with `data-ad-slot`, no network code until AdSense approval.
- PWA/offline: manifest only; service worker deferred to stage F (not required for "Done when" of B/C).
- Spanish: registry supports `slugs.es`; `/es/` pages render only when `status.es === 'published'`; none in this feature.
