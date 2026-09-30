# Tasks: Site Skeleton + Gravel Calculator Pilot

**Input**: `specs/001-site-skeleton-gravel/{spec,plan,research,data-model}.md`
**Tests**: required by Constitution II (logic) and IV/V (Playwright); included.
**Format**: `[ID] [P?] [Story] Description` — `[P]` = parallelisable (different files).

## Phase 1: Setup

- [ ] T001 Create `package.json` with scripts `dev, build, preview, check, test, test:e2e, seo-lint, links, new` and dependencies from research.md §1
- [ ] T002 [P] Create `astro.config.mjs` (site from `SITE_URL`, trailingSlash always, directory format, preact+mdx+sitemap(i18n), tailwind vite plugin, i18n en/es)
- [ ] T003 [P] Create `tsconfig.json` (astro strict, jsx preact), `vitest.config.ts` (getViteConfig), `playwright.config.ts` (iPhone SE + Pixel 7, webServer preview)
- [ ] T004 [P] Create `.gitattributes`, extend `.gitignore` (node_modules, dist, .astro, test-results, playwright-report, .env), `.editorconfig`, update `.env.example` with `SITE_URL`
- [ ] T005 [P] Create `src/styles/global.css` (Tailwind v4 import, tokens light/dark, base typography, print styles)
- [ ] T006 [P] Create `src/data/site.ts` (brand placeholder, SITE_URL, org data) and `src/data/categories.ts` (10 categories)
- [ ] T007 `npm install`; verify `npx astro --version`

## Phase 2: Foundational (registry, schema, layout)

- [ ] T010 Create `src/lib/define-calculator.ts` (types + `defineCalculator`)
- [ ] T011 Create `src/lib/registry.ts` (glob collect, validation errors, accessors, symmetrised related, manifest)
- [ ] T012 [P] Create `src/lib/format.ts`, `src/lib/parse-input.ts`, `src/lib/url-state.ts` with unit tests `src/lib/*.test.ts`
- [ ] T013 [P] Create `src/lib/seo.ts` (canonical, hreflang, JSON-LD builders: WebApplication, BreadcrumbList, FAQPage, Organization, WebSite)
- [ ] T014 Create `src/content.config.ts` with the four collections and zod rules from data-model.md
- [ ] T015 [P] Create `src/content/authors/editorial-team.md` (TODO placeholder) and `src/i18n/en.json`, `src/i18n/es.json`
- [ ] T016 [P] Create `src/components/Head.astro`, `JsonLd.astro`, `Breadcrumbs.astro`, `AdSlot.astro`, `FAQ.astro`, `RelatedCards.astro`, `NextSteps.astro`, `Calc.astro` (throws on unknown slug), `SearchBox.astro` (Pagefind lazy)
- [ ] T017 Create `src/components/layout/{Header,MegaMenu,MobileNav,Footer}.astro` driven by registry + categories
- [ ] T018 Create `src/layouts/{Base,ServicePage,CategoryHub,CalculatorPage}.astro`
- [ ] T019 [P] Create `public/robots.txt`, `public/favicon.svg`, `public/manifest.webmanifest`

**Checkpoint**: `npm run check` passes with an empty registry.

## Phase 3: User Story 3 — Navigation & service pages (P2, needed before pages render)

- [ ] T020 Create `src/pages/index.astro` (hero with search, category grid with published calculators, popular list; Organization+WebSite JSON-LD)
- [ ] T021 [P] Create `src/pages/[category]/index.astro` using CategoryHub and `src/content/categories/en/{time-date,work-pay,construction,math,conversions}.mdx`
- [ ] T022 [P] Create service pages `about, methodology, editorial-policy, authors, contact, privacy, terms, do-not-sell` (ServicePage layout; unique title/description; real text, placeholders marked TODO only for names/emails)
- [ ] T023 [P] Create `src/pages/404.astro` (search + popular calculators; `noindex`)
- [ ] T024 Create `src/pages/_registry.json.ts` (manifest endpoint) and `src/pages/og/[slug].png.ts` (satori + sharp, Inter woff)
- [ ] T025 Create `src/pages/[slug].astro` (CalculatorPage; loads registry meta + content entry; dynamic island import by `meta.island`) and `src/pages/es/[slug].astro` (published es only)

**Checkpoint**: `npm run build` succeeds with zero calculators; hubs and service pages render.

## Phase 4: User Story 2 — UI kit & scaffolder (P1)

- [ ] T030 [P] Create Preact UI kit `src/components/ui/{NumberInput,Segmented,UnitToggle,ResultCard,ResultTable,StickyResult,CopyButton,ShareButton,PrintButton,CsvButton}.tsx` (a11y: labels, aria-live, 48 px targets, inputmode)
- [ ] T031 [P] Create `scripts/templates/*.tpl` and `scripts/new-calculator.mjs` (`npm run new <id>`)
- [ ] T032 Create draft stubs `src/calculators/{cubic-yards,mulch,concrete,square-footage,topsoil}/meta.ts` (status draft) so links resolve

## Phase 5: User Story 1 — Gravel calculator (P1) 🎯 MVP

- [ ] T040 Brief `docs/briefs/gravel-calculator.md` ✔ (done in planning)
- [ ] T041 Create `src/calculators/gravel/types.ts` and `gravel-types.ts` (density table with sources)
- [ ] T042 Create `src/calculators/gravel/logic.ts` (pure functions per data-model)
- [ ] T043 Create `src/calculators/gravel/logic.test.ts` (10 reference examples from brief §3 + edge cases) → `npm test` green
- [ ] T044 Create `src/calculators/gravel/GravelCalculator.tsx` (multi-area form, type/density, waste, price, bags; results yd³/tons/bags/cost; steps; sticky result; URL state; Copy/Share/Print/CSV)
- [ ] T045 Create `src/content/calculators/en/gravel-calculator.mdx` per brief §5 (H2 plan, tables, 8 FAQ, sources, ≥ 3 `<Calc>` links)
- [ ] T046 Create `src/calculators/gravel/meta.ts` (published; related/next/aliases per brief)
- [ ] T047 Build; verify `/gravel-calculator/` renders island SSR (fields + default result visible in HTML), `/construction/` lists it, related backlinks exist, sitemap contains it

## Phase 6: User Story 4 — Quality gates (P2)

- [ ] T050 [P] Create `scripts/seo-lint.mjs` (rules 1–4, 6, 7 of docs/07 + JS budget from manifest) with non-zero exit on error
- [ ] T051 [P] Create `scripts/link-report.mjs` (orphans, < 3 inbound, broken links)
- [ ] T052 [P] Create `tests/e2e/calculator.spec.ts` and `tests/e2e/pages.spec.ts` (viewport, result change, no horizontal scroll, one H1, canonical)
- [ ] T053 Run `npm run check && npm test && npm run build && npm run seo-lint && npm run links && npm run test:e2e`; fix until green
- [ ] T054 Negative fixtures: temporarily break `<Calc slug>` and title length → confirm build/seo-lint fail; revert

## Phase 7: Polish & handoff

- [ ] T060 Add "Development commands" section to `CLAUDE.md`; update `README.md` status table (stage B/C done, repo/domain pending) and structure tree
- [ ] T061 Update `Page_Plan_12_months.xlsx` All pages: `/gravel-calculator/` → `In progress` (Published only after real deploy)
- [ ] T062 Commit on branch `001-site-skeleton-gravel`; summarise open owner decisions (GitHub org, domain, hosting) for HANDOFF §5

## Dependencies

T001–T007 → T010–T019 → T020–T025 → T030–T032 → T040–T047 → T050–T054 → T060–T062.
Parallel groups: {T002,T003,T004,T005,T006}, {T012,T013,T015,T016,T019}, {T021,T022,T023}, {T030,T031}, {T050,T051,T052}.
