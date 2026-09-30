# Feature Specification: Site Skeleton + Gravel Calculator Pilot

**Feature Branch**: `001-site-skeleton-gravel`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "Build stage B (site skeleton) and stage C (first calculator, gravel, end to end) from docs/10-build-guide.md, so the project has a working, empty-but-complete site where new pages are added without manual menu/link/SEO work, plus one reference calculator that every following calculator copies."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Homeowner estimates gravel on a phone (Priority: P1)

A homeowner standing in their yard opens `/gravel-calculator/` on a phone. Without scrolling they see the calculator already filled with a typical example (a 10 × 10 ft area, 3 in deep) and the answer: cubic yards, US tons and 0.5 cu ft bags. They change length, width, depth and gravel type; the result updates as they type. They tap "Show how it's calculated" and read the formula with their own numbers, then copy or share the result link.

**Why this priority**: This is the page that earns the first traffic (60 500 searches/month, SD 21, weakest top-10 of the launch cluster). Everything else exists to make many more pages like it.

**Independent Test**: Open the page at 375×667 with JS disabled: fields, labels and the default result are visible in HTML. Enable JS, change depth to 4 in: the result updates immediately, `?l=10&w=10&d=4&t=…` appears in the URL, canonical remains `/gravel-calculator/`.

**Acceptance Scenarios**:

1. **Given** the page loads at 375 px wide, **When** no input is touched, **Then** the H1, first fields and the default result are all within the first 667 px, and there is no horizontal scroll.
2. **Given** 10 ft × 10 ft × 3 in, gravel type "Crushed stone", **When** the page renders, **Then** it shows 0.93 yd³ (rounded from 0.926) and tons computed from the visible density, and the explanation shows `10 × 10 × (3 ÷ 12) ÷ 27`.
3. **Given** the user adds a second area (circle, 8 ft diameter, 2 in), **When** both areas are set, **Then** the totals sum both areas and each area's contribution is listed.
4. **Given** a shared URL with state params, **When** opened on another device, **Then** the same inputs and results are restored.
5. **Given** an empty or negative field, **When** the user leaves it, **Then** a text error appears under the field and the total excludes that area, without crashing.

---

### User Story 2 - Editor adds a new calculator without touching navigation (Priority: P1)

A developer/editor runs `npm run new <id>`, fills `meta.ts`, `logic.ts`, tests, UI and the MDX text. The category hub, header mega-menu, breadcrumbs, related cards on neighbouring calculators, sitemap and JSON-LD all include the new page after `npm run build`, with no manual edits elsewhere.

**Why this priority**: The plan is 143 pages at launch and 1 020 in a year; hand-maintained navigation does not scale and produces orphan pages.

**Independent Test**: Scaffold a throwaway calculator `demo`, set `category: 'math'`, `related: ['gravel']`; build; assert `/math/` lists it, `/gravel-calculator/` shows it in Related (bidirectional), `sitemap-index.xml` contains it. Delete it; build succeeds again.

**Acceptance Scenarios**:

1. **Given** a `meta.ts` with a `related` id that does not exist, **When** `npm run build` runs, **Then** the build fails with a message naming the file and the bad id.
2. **Given** two calculators with the same primary keyword, **When** building, **Then** the build fails (anti-cannibalisation).
3. **Given** MDX text containing `<Calc slug="nope">`, **When** building, **Then** the build fails naming the slug.
4. **Given** frontmatter with `title` of 61 characters, **When** building, **Then** the schema validation fails.

---

### User Story 3 - Visitor navigates the site (Priority: P2)

A visitor lands on the home page or a hub, searches "gravel" in the site search, sees the result, opens it, follows breadcrumbs back to the Construction hub, and reads About / Methodology / Privacy from the footer.

**Why this priority**: Required for trust (E-E-A-T) and indexation, but produces no traffic on its own.

**Independent Test**: Build; open `/`, `/construction/`, `/about/`, `/methodology/`, `/editorial-policy/`, `/authors/`, `/contact/`, `/privacy/`, `/terms/`, `/404.html`; each returns valid HTML with unique title, description, canonical and breadcrumbs (except home). Pagefind search for "gravel" returns the gravel page.

**Acceptance Scenarios**:

1. **Given** any built page, **When** inspected, **Then** it has exactly one H1, `<html lang="en-US">`, a self canonical with trailing slash, OG tags and JSON-LD `BreadcrumbList` (except `/`).
2. **Given** the home page, **When** rendered, **Then** it lists all published categories with their published calculators and has `Organization` + `WebSite` JSON-LD.
3. **Given** a hub, **When** rendered, **Then** it shows its intro text, all published calculators in that category (including `alsoIn`), and ≥ 3 FAQ.

---

### User Story 4 - Maintainer trusts the quality gates (Priority: P2)

A maintainer runs `npm run check`, `npm test`, `npm run build`, `npm run seo-lint`, `npm run links`, `npm run test:e2e` locally and gets a clear pass/fail for each rule from `docs/07-seo-checklist.md` §"Що автоматизуємо".

**Why this priority**: Stage D (CI) builds on these scripts; they must exist and be honest before a repository or pipeline exists.

**Independent Test**: Introduce a page with a 170-character description: `seo-lint` fails naming the page and rule. Remove the only inbound link to a page: `links` reports it as orphan.

**Acceptance Scenarios**:

1. **Given** the built `dist/`, **When** `seo-lint` runs, **Then** it checks title/description/H1 lengths and uniqueness, heading hierarchy, canonical, `lang`, no accidental `noindex`, JSON-LD validity, FAQ ≥ 4, sources ≥ 1, author and updated present.
2. **Given** the built `dist/`, **When** `links` runs, **Then** it reports orphans, pages with < 3 inbound links, and broken internal links, with non-zero exit on orphans/broken.
3. **Given** Playwright with iPhone SE and Pixel 7 profiles, **When** `test:e2e` runs against the preview, **Then** every calculator page has the calculator above the fold, the result changes after input, and `document.documentElement.scrollWidth <= innerWidth`.

---

### Edge Cases

- Depth given in inches while length/width in feet (default) — mixed units must convert correctly; metric toggle switches all fields together.
- Very large inputs (1 000 000 ft): result formats with thousands separators, no scientific notation, no overflow layout.
- Zero depth or zero dimension: area contributes 0, no division errors, explanation still renders.
- Density custom value out of range (< 50 or > 200 lb/ft³): warning text, value still used.
- Bag output when volume is tiny (< 1 bag): rounds up to 1 bag.
- URL state with unknown gravel type or malformed number: falls back to defaults silently.
- JS disabled: server-rendered default example visible; inputs present but static; no broken layout.
- Dark mode via `prefers-color-scheme`: contrast ≥ 4.5:1 on both themes.
- A calculator listed in `alsoIn` must not appear twice on a hub or be counted twice in link reports.

## Requirements *(mandatory)*

### Functional Requirements

**Skeleton (stage B)**

- **FR-001**: The site MUST be an Astro static project with Preact islands, TypeScript strict, Tailwind v4, MDX content collections, sitemap and Pagefind, configured with `trailingSlash: 'always'`, `build.format: 'directory'`, i18n `en` default (no prefix) and `es` (prefixed, unpublished).
- **FR-002**: A registry (`src/registry.ts`) MUST collect every `src/calculators/*/meta.ts`, validate ids, slugs, primary keywords, categories, `related`, `next`, `alsoIn`, and expose typed accessors (by slug, by category, related-with-backlinks, breadcrumbs, hreflang pairs).
- **FR-003**: Category definitions (10 hubs from `docs/03-architecture.md` §1) MUST live in one data file and drive the header menu, footer, hubs and breadcrumbs.
- **FR-004**: `src/content.config.ts` MUST define collections `calculators`, `categories`, `authors`, `guides` with zod schemas enforcing the limits in Constitution VI (`reviewer` required when `ymyl`).
- **FR-005**: A `Base` layout MUST provide header (logo, always-visible search, category menu / burger), breadcrumbs slot, footer (categories + 8 service links), skip link, theme tokens with light/dark, and `Head` (title, description, canonical, hreflang, OG/Twitter, `theme-color`, manifest).
- **FR-006**: A `CalculatorPage` layout MUST render blocks in this order: breadcrumbs, H1, one-line intro, calculator island, ad slot (reserved height), "What to calculate next" buttons, MDX content, FAQ (visible, with `FAQPage` JSON-LD), Related cards, Sources / Author / Reviewed by / Last updated.
- **FR-007**: A `CategoryHub` layout MUST render intro, grouped calculator cards (one-line description each), FAQ, breadcrumbs.
- **FR-008**: Routes MUST exist for `/`, `/[slug]/` (calculators), `/[category]/`, the 8 service pages, and `/404.html` (with search and popular calculators). `/es/` routes are prepared but only render when a calculator has `status: 'published'` for `es`.
- **FR-009**: UI kit components MUST exist and be reused by the pilot: `NumberInput` (inputmode, smart parse of `1,250` and `3'6"`), `UnitToggle`, `Segmented`, `ResultCard`, `ResultTable`, `StickyResult`, `CopyButton`, `ShareButton` (URL state + Web Share API with clipboard fallback), `PrintButton`, `CsvButton`, `AdSlot`, `FAQ`, `Breadcrumbs`, `RelatedCards`, `NextSteps`, `Calc` (MDX link that fails the build for unknown slugs).
- **FR-010**: `JsonLd` MUST emit `WebApplication` (+ `applicationCategory`, free offer), `BreadcrumbList`, `FAQPage` on calculator pages, `Organization` + `WebSite` on home.
- **FR-011**: `public/robots.txt` MUST allow all, disallow `/search/`, reference the sitemap, and explicitly allow `Googlebot`, `Bingbot`, `OAI-SearchBot`, `PerplexityBot`.
- **FR-012**: An OG image MUST be generated per calculator at build time (satori + sharp or equivalent), referenced in `og:image`.
- **FR-013**: Scripts MUST exist: `scripts/new-calculator.mjs` (scaffold from templates), `scripts/seo-lint.mjs`, `scripts/link-report.mjs`; `package.json` MUST expose `dev`, `build` (astro build + pagefind), `preview`, `check`, `test`, `test:e2e`, `seo-lint`, `links`, `new`.
- **FR-014**: The project MUST keep `docs/`, `research/`, `CLAUDE.md`, `HANDOFF.md`, `README.md` in the repository root alongside `src/` as described in `docs/04-tech-and-deploy.md` §2.

**Pilot (stage C)**

- **FR-020**: A brief `docs/briefs/gravel-calculator.md` MUST be completed per `docs/09` before UI work and MUST list 3 verifiable advantages over calculator.net, omnicalculator and inchcalculator.
- **FR-021**: `src/calculators/gravel/logic.ts` MUST expose pure functions: area for rectangle / circle / triangle / direct-area, volume in ft³ and yd³ (and m³), weight in US tons and lb from density (lb/ft³), bags (0.5 cu ft default, configurable), cost from price per yd³ or per ton, waste/compaction percentage, and totals over multiple areas.
- **FR-022**: `logic.test.ts` MUST include ≥ 5 reference examples, ≥ 2 from primary sources (NIST unit factors; supplier/DOT density table), plus edge cases (0, negative, huge, unit mixes).
- **FR-023**: The UI island MUST support multiple areas (add/remove), shape selector, imperial default with metric toggle, gravel-type selector with visible density (editable custom), waste % (default 10 %, visible), results in yd³ + tons + bags, cost when price given, "How it's calculated" with substituted numbers, sticky result on mobile when the form exceeds the viewport, Copy / Share / Print / CSV.
- **FR-024**: `src/content/calculators/en/gravel-calculator.mdx` MUST follow the brief's H2 plan: How to use · Formula · Examples table (typical driveways/paths) · Depth by project & gravel types table · FAQ (≥ 6) · Sources; with ≥ 3 `<Calc>` links to existing or planned launch calculators (stubs allowed as `status: 'draft'` so links resolve).
- **FR-025**: `meta.ts` MUST set `category: 'construction'`, `related` 4–6, `next` 2–3, `aliases`, `primaryKeyword: 'gravel calculator'`, `ymyl: false`, `status: 'published'`.
- **FR-026**: All quality scripts (`check`, `test`, `build`, `seo-lint`, `links`, `test:e2e`) MUST pass on the pilot before the feature is considered done.

### Key Entities

- **Calculator (meta)**: `id`, `slugs{en, es?}`, `primaryKeyword`, `category`, `alsoIn[]`, `related[]`, `next[]`, `aliases[]`, `ymyl`, `status{en, es}`, `applicationCategory`, `redirectsFrom[]`.
- **Category**: `id`, `slug`, `name`, `shortName`, `order`, `intro` (in content), `subgroups[]`.
- **Content entry (calculators collection)**: frontmatter per Constitution VI + `calculatorId`, `locale`.
- **Author**: `id`, `name`, `role`, `bio`, `credentials`, `sameAs[]`.
- **Area (gravel)**: `shape`, dimensions, `depth`, `unitSystem`; **GravelType**: `id`, `label`, `densityLbFt3`, `source`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `npm run build` from a clean clone completes and produces every route listed in FR-008 plus `/gravel-calculator/` in under 90 seconds on a laptop.
- **SC-002**: At 375×667 the gravel calculator's first input and default result are inside the initial viewport (Playwright assertion), and `scrollWidth === clientWidth`.
- **SC-003**: Lighthouse mobile on `/gravel-calculator/` (preview build): Performance ≥ 90, Accessibility ≥ 95, SEO = 100; total JS ≤ 50 KB gzip.
- **SC-004**: All gravel reference examples pass; results for 10×10 ft × 3 in match calculator.net, inchcalculator and calculatorsoup within rounding when the same density is entered, and any remaining difference is explained in the brief.
- **SC-005**: Adding a scaffolded calculator with `npm run new` and one `meta.ts` edit makes it appear on its hub, in related cards of neighbours, in the sitemap and in search, with zero edits to layouts or navigation files.
- **SC-006**: `seo-lint` and `links` exit non-zero on the deliberate-error fixtures described in User Story 4 and zero on the clean build.

## Assumptions

- Domain is undecided: `site` is set to `https://example.com` via `SITE_URL` env with a placeholder default; every absolute URL derives from it.
- Brand name is undecided: a neutral working name ("Calc Site") is used in a single constants file for later replacement.
- No GitHub repository, domain or deployment is created in this feature (owner's decision pending, `HANDOFF.md` §5). Work is committed to the local git repository initialised by spec-kit.
- Authors are placeholders with clearly marked `TODO` bios until the owner supplies real people; the pilot is not YMYL so no reviewer is required.
- Mulch, concrete, cubic-yards, square-footage and topsoil calculators referenced from gravel are created as `status: 'draft'` stubs (meta only) so internal links and related cards resolve; they are built in stage F.
