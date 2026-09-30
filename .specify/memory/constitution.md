# US Calculators Site Constitution

Static site of online calculators, unit converters and quick answers for Google Search in the United States. Revenue: display ads. Source of truth for strategy and rules: `CLAUDE.md`, `HANDOFF.md`, `docs/01`–`docs/10`. This constitution distils those documents into non-negotiable engineering principles.

## Core Principles

### I. Brief Before Build (NON-NEGOTIABLE)
No page enters development without a completed brief (`docs/templates/page-brief.md`) produced by the checklist in `docs/09-page-brief-checklist.md`. The brief MUST name **3 concrete, verifiable advantages over the current top-3** competitor pages; otherwise the page is postponed. Ubersuggest is not used; sources are the collected data in `research/`, direct analysis of competitor pages, official formula sources, and (after launch) Google Search Console. Briefs live in `docs/briefs/<slug>.md`.

### II. Pure Logic, Proven by Tests
Every calculator's math lives in `src/calculators/<id>/logic.ts` as pure TypeScript functions with no UI or DOM dependency. Each `logic.test.ts` MUST contain ≥ 5 reference examples, of which ≥ 2 come from a primary source (NIST, U.S. DOL, IRS, CDC/NIH, manufacturer data). Edge cases (0, negative, very large, midnight, Feb 29, DST) are tested explicitly. A formula without a cited primary source does not ship.

### III. Registry Generates Structure
Menus, category hubs, breadcrumbs, related/next links, sitemap, hreflang and JSON-LD are generated from a single registry (`src/registry.ts` collecting every `meta.ts`). Nothing structural is hand-maintained. The build MUST fail on: duplicate slugs or primary keywords (cannibalisation), unknown `related`/`next`/`category` ids, or a `<Calc slug>` that does not exist. `related` links are made bidirectional automatically.

### IV. Mobile-First, Instant Result
Designed at 360–430 px first. The calculator is visible above the fold at 375×667 with a sensible default example and a result shown immediately; recalculation happens on input, with no "Calculate" button. No ads or images between H1 and the calculator. Inputs use the correct `inputmode`, ≥ 16 px font, ≥ 48 px touch targets; no horizontal scroll. Every field has a visible `<label>`; results use `aria-live`.

### V. Static, Fast, Server-Rendered
Astro static output. Calculator islands are server-rendered to HTML (fields, labels and default result visible without JS) and hydrated with Preact. Budgets enforced in CI: JS ≤ 50 KB gzip per calculator page, Lighthouse mobile Performance ≥ 90, Accessibility ≥ 95, SEO = 100, CLS < 0.05. Ad slots reserve height. Fonts are local with `font-display: swap`.

### VI. SEO Contract Per Page
Flat, lowercase, hyphenated URLs with trailing slash (`/gravel-calculator/`), slug = primary query, never changed after publication without a 301 recorded in the registry. Frontmatter is schema-validated (zod): `title` ≤ 60, `description` 120–155, `h1`, `intro`, `faq[]` ≥ 4, `sources[]`, `author`, `updated`; `reviewer` is required when `ymyl: true`. Self-referencing canonical without query params; state lives in URL params only. JSON-LD: `WebApplication` + `BreadcrumbList` + `FAQPage` (only for visible FAQ).

### VII. Trust and YMYL Gates
About, Methodology, Editorial Policy, Authors, Contact, Privacy, Terms and "Do Not Sell or Share" exist from day one. Finance, health and state-tax pages ship only with a qualified reviewer, `.gov`/`.edu` sources, a disclaimer and a data-update date, and not before their planned month (`Page_Plan_12_months.xlsx`, Legend → gates).

### VIII. No Template Spam
Value pages ("80 kg to lbs", "90 days from today") are created only with confirmed demand ≥ 1 000 searches/month and unique value beyond the number (neighbour table, percentile, calendar). Text is written per page for its intent; content that differs only by the calculator name is rejected. Text length follows intent (400–700 words simple, 1 000–1 800 complex), not a quota.

## Technology Constraints

- **Stack**: Astro (static) · Preact 10 islands · TypeScript strict · Tailwind CSS v4 · MDX content collections · Pagefind search · Vitest (logic) · Playwright (mobile smoke). Details and rationale: `docs/04-tech-and-deploy.md`.
- **Layout**: one calculator = `src/calculators/<id>/{meta.ts, logic.ts, logic.test.ts, <Ui>.tsx}`; content = `src/content/calculators/<locale>/<slug>.mdx`; shared UI kit in `src/components/`; layouts in `src/layouts/`; routes generated in `src/pages/`.
- **i18n**: en-US default without prefix; es-US under `/es/` with translated slugs, prepared in the registry but not published before month 5. hreflang only for pairs that exist.
- **Secrets**: only in `.env` (git-ignored). No keys in code, docs or commits.
- **Deployment**: static `dist/` via Dockerfile (node build → nginx) to Dokploy + Cloudflare, or Cloudflare Pages. Deploy only after green CI. No repository on GitHub, domain purchase or deployment without the owner's explicit decision (`HANDOFF.md` §5).

## Development Workflow

- Follow `docs/10-build-guide.md` stages A–H in order; do not start a stage before the previous stage's "Done when" criterion is met.
- One branch per calculator (`calc/<id>`), changes via Pull Request with the checklist: tests, sources, FAQ, related/next, mobile screenshot, link to brief.
- CI gates on every PR: `astro check`, `vitest`, `astro build`, `seo-lint`, `link-report`, Playwright mobile smoke, Lighthouse budgets. A PR with a deliberate error (title too long, broken `<Calc>`) MUST fail.
- After a page is published, set Status = `Published` in `Page_Plan_12_months.xlsx` (sheet All pages).
- Spec-driven development for every feature larger than a single page: `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. Specs live in `specs/`.

## Governance

This constitution operationalises `CLAUDE.md` and `docs/`; where they conflict, `CLAUDE.md` (owner's decisions) wins and this file is amended. Amendments require a version bump, a dated entry here and, when a principle changes, an update to the affected docs and templates. Every PR review verifies compliance with Principles I–VIII. Complexity beyond the documented stack must be justified in the plan's Complexity Tracking table.

**Version**: 1.0.0 | **Ratified**: 2026-09-30 | **Last Amended**: 2026-09-30
