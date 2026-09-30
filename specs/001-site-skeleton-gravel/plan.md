# Implementation Plan: Site Skeleton + Gravel Calculator Pilot

**Branch**: `001-site-skeleton-gravel` | **Date**: 2026-09-30 | **Spec**: `specs/001-site-skeleton-gravel/spec.md`

**Input**: Feature specification from `specs/001-site-skeleton-gravel/spec.md`

## Summary

Deliver stages B and C of `docs/10-build-guide.md`: an Astro 7 static site whose navigation, hubs, breadcrumbs, related/next links, sitemap and JSON-LD are generated from a validated calculator registry, plus the first production calculator (gravel) built from its brief with pure tested logic, a Preact island, MDX content and quality scripts (`seo-lint`, `links`, Playwright mobile smoke). No GitHub repo, domain or deploy (owner decisions pending).

## Technical Context

**Language/Version**: TypeScript 7 (strict), Node 24 LTS
**Primary Dependencies**: astro 7.3.5, @astrojs/preact 6.0.5 + preact 10.29.8, @astrojs/mdx 8.0.2, @astrojs/sitemap 3.7.4, tailwindcss 4.3.3 (@tailwindcss/vite), pagefind 1.5.2, satori + sharp (OG), node-html-parser (scripts)
**Storage**: none (static files; calculator state in URL params)
**Testing**: vitest 5 (logic), @playwright/test 1.63 (mobile smoke), astro check
**Target Platform**: static HTML/CSS/JS, mobile-first (375×667 baseline), modern evergreen browsers
**Project Type**: static web site (single project)
**Performance Goals**: JS ≤ 50 KB gzip on calculator pages; Lighthouse mobile Perf ≥ 90, A11y ≥ 95, SEO 100; CLS < 0.05
**Constraints**: calculator server-rendered (visible without JS); no ads between H1 and calculator; slugs immutable; secrets only in `.env`
**Scale/Scope**: skeleton for ~1 000 pages/year; this feature ships 1 published calculator, 5 draft stubs, 10 hubs (5 published with content), 8 service pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How this plan complies |
|---|---|---|
| I Brief before build | PASS | `docs/briefs/gravel-calculator.md` completed (3 advantages listed) before any UI task |
| II Pure logic + tests | PASS | `logic.ts` pure; `logic.test.ts` with 10 examples, 2 from NIST/DOT |
| III Registry generates structure | PASS | `src/registry.ts` validation throws at build; `<Calc>` throws on unknown slug |
| IV Mobile-first, instant result | PASS | default example, recompute on input, sticky result, Playwright 375×667 checks |
| V Static, fast, SSR islands | PASS | `client:load` island server-rendered by @astrojs/preact; JS budget checked in seo-lint (size of `_astro/*.js` referenced by page) |
| VI SEO contract | PASS | zod schema limits; `Head.astro` canonical/hreflang/OG; JSON-LD component |
| VII Trust pages | PASS | 8 service pages with placeholder author bios marked TODO (pilot is non-YMYL) |
| VIII No template spam | PASS | one hand-written MDX; stubs are `draft` and not rendered |
| Tech constraints | PASS | stack exactly as mandated; Preact 10 chosen for peer compatibility (documented) |
| Workflow | PASS | spec → plan → tasks → implement; local commits only |

Post-design re-check: no violations. Complexity Tracking not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-site-skeleton-gravel/
├── spec.md
├── plan.md              # this file
├── research.md          # versions, registry design, gravel data
├── data-model.md        # types: CalculatorMeta, Category, content schemas, gravel model
├── quickstart.md        # how to run, test, add a calculator
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks output
```

### Source Code (repository root = `C:\repo\calculator\Calculator`)

```text
package.json  astro.config.mjs  tsconfig.json  vitest.config.ts  playwright.config.ts
.env.example  .gitignore  .editorconfig
public/
├── robots.txt  favicon.svg  manifest.webmanifest
src/
├── styles/global.css                 # Tailwind v4 import + design tokens (light/dark)
├── data/site.ts                      # brand, SITE_URL, social, org JSON-LD data
├── data/categories.ts                # 10 categories
├── lib/
│   ├── define-calculator.ts          # CalculatorMeta type + defineCalculator()
│   ├── registry.ts                   # collect + validate + accessors
│   ├── url-state.ts                  # encode/decode calculator state ↔ URLSearchParams
│   ├── format.ts                     # number formatting (thousands, precision)
│   ├── parse-input.ts                # "1,250" → 1250, "3'6\"" → 3.5 ft
│   └── seo.ts                        # canonical/hreflang/JSON-LD builders
├── content.config.ts
├── content/
│   ├── calculators/en/gravel-calculator.mdx
│   ├── categories/en/{time-date,work-pay,construction,math,conversions}.mdx
│   └── authors/editorial-team.md
├── calculators/
│   ├── gravel/{meta.ts,logic.ts,logic.test.ts,GravelCalculator.tsx,types.ts,gravel-types.ts}
│   ├── cubic-yards/meta.ts   mulch/meta.ts   concrete/meta.ts   square-footage/meta.ts   topsoil/meta.ts   (draft stubs)
├── components/
│   ├── ui/{NumberInput,Segmented,UnitToggle,ResultCard,ResultTable,StickyResult,CopyButton,ShareButton,PrintButton,CsvButton}.tsx   # Preact
│   ├── {AdSlot,FAQ,Breadcrumbs,RelatedCards,NextSteps,Calc,Head,JsonLd,SearchBox,ThemeTokens}.astro
│   └── layout/{Header,Footer,MegaMenu,MobileNav}.astro
├── layouts/{Base,CalculatorPage,CategoryHub,ServicePage}.astro
├── pages/
│   ├── index.astro  [slug].astro  [category]/index.astro  404.astro
│   ├── {about,methodology,editorial-policy,authors,contact,privacy,terms,do-not-sell}.astro
│   ├── og/[slug].png.ts              # OG image endpoint (satori + sharp)
│   ├── _registry.json.ts             # manifest for scripts (emitted to dist/_registry.json)
│   └── es/[slug].astro               # renders only published es entries (none yet)
├── i18n/{en.json,es.json}
scripts/
├── new-calculator.mjs  seo-lint.mjs  link-report.mjs
├── templates/{meta.ts.tpl,logic.ts.tpl,logic.test.ts.tpl,Ui.tsx.tpl,page.mdx.tpl}
tests/e2e/{calculator.spec.ts,pages.spec.ts}
docs/ research/ CLAUDE.md HANDOFF.md README.md Page_Plan_12_months.xlsx   # existing
```

**Structure Decision**: single Astro project at repository root; calculators are self-contained folders; scripts operate on `dist/` output so they stay framework-agnostic.

## Phase 0 — Research (done → `research.md`)

Resolved: package versions and peer constraints (Preact 10), Tailwind v4 CSS-first setup, content layer API, registry collection via `import.meta.glob`, OG generation approach, gravel density table with sources, quality script strategy.

## Phase 1 — Design

- `data-model.md`: `CalculatorMeta`, `Category`, content schemas, gravel `Area`/`GravelType`/`Result` types, URL state format `?a=rect:10:10:3,circle:8:2&t=crushed-stone&w=10&u=imp&p=45&pu=yd`.
- `contracts/`: not applicable (no API). Registry accessor signatures are documented in data-model.
- `quickstart.md`: install, dev, test, build, lint, e2e, add calculator.
- Agent context: `CLAUDE.md` already covers rules; add a short "Development commands" section after implementation.

## Phase 2 — Implementation order (for `/speckit-tasks`)

1. **Scaffold**: package.json, configs, global.css, site data, categories.
2. **Registry + content schema**: define-calculator, registry with validation, content.config, authors, category MDX.
3. **Layout + SEO**: Base, Head, JsonLd, Header/Footer/MegaMenu/MobileNav, Breadcrumbs, ServicePage; service pages; 404; robots; manifest.
4. **Routes**: index, `[slug]`, `[category]`, `_registry.json`, og endpoint.
5. **UI kit** (Preact + Astro components).
6. **Gravel**: brief ✔ → types + gravel-types + logic + tests → island → MDX → meta + stubs.
7. **Scripts**: new-calculator, seo-lint, link-report; Playwright config + specs.
8. **Verify**: check, test, build, seo-lint, links, e2e, JS budget; fix until green; commit.

## Risks

| Risk | Mitigation |
|---|---|
| Astro 7 API drift vs my knowledge | context7 docs consulted; run `astro check` early; keep config minimal |
| satori font/emoji issues on Windows | bundle `@fontsource/inter` woff; OG endpoint isolated so failures do not block pages (fallback static PNG) |
| Pagefind binary download blocked | `pagefind` npm downloads platform binary on first run; if offline, `build` still succeeds because `pagefind` runs after `astro build` and is `||`-guarded with a warning in stage B; stage D makes it strict |
| Playwright browser download size/time | `npx playwright install chromium` once; e2e runs against `astro preview` |
| Windows CRLF warnings | `.gitattributes` with `* text=auto eol=lf` |
