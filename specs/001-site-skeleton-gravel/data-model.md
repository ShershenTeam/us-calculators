# Data Model: Site Skeleton + Gravel Calculator Pilot

## CalculatorMeta (`src/lib/define-calculator.ts`)

```ts
type Locale = 'en' | 'es';
type Status = 'draft' | 'published';

interface CalculatorMeta {
  id: string;                          // 'gravel' — folder name, immutable
  slugs: { en: string; es?: string };  // 'gravel-calculator' — URL, immutable after publish
  primaryKeyword: string;              // 'gravel calculator' — unique across registry
  category: CategoryId;                // 'construction'
  alsoIn?: CategoryId[];               // extra hubs where the card appears
  related: string[];                   // 4–6 calculator ids (symmetrised at build)
  next: string[];                      // 2–3 calculator ids ("what to calculate next")
  aliases: string[];                   // synonyms for search + anchors
  ymyl: boolean;
  status: { en: Status; es?: Status };
  applicationCategory: 'UtilitiesApplication' | 'FinanceApplication' | 'HealthApplication' | 'EducationalApplication';
  redirectsFrom?: string[];            // old slugs → 301 (nginx map generated later)
  island?: string;                     // component file name, e.g. 'GravelCalculator'
}
```

Validation (build-time, throws `RegistryError` with file + reason):
- unique `id`, unique `slugs.en`, unique `slugs.es`, unique `primaryKeyword` (case-insensitive)
- `category` and every `alsoIn` ∈ categories
- every `related`/`next` id exists; `related.length` 4–6 and `next.length` 2–3 **only when** `status.en === 'published'` (drafts may be partial)
- slug regex `^[a-z0-9]+(-[a-z0-9]+)*$`

Derived (`Registry`):
- `all()`, `published(locale)`, `bySlug(slug, locale)`, `byId(id)`, `byCategory(catId, locale)` (includes `alsoIn`, de-duplicated)
- `relatedOf(id)` → symmetrised set, ordered: explicit first, then backlinks, capped 6
- `nextOf(id)`, `breadcrumbs(id, locale)`, `hreflang(id)` → `{ 'en-US': url, 'es-US'?: url, 'x-default': url }`
- `manifest()` → JSON for `dist/_registry.json`: `{ slug, url, id, category, status, primaryKeyword, island }[]`

## Category (`src/data/categories.ts`)

```ts
interface Category {
  id: CategoryId;        // 'construction'
  slug: string;          // 'construction' → /construction/
  name: string;          // 'Home & Construction'
  shortName: string;     // 'Construction' (header)
  order: number;
  icon?: string;
  subgroups?: { id: string; name: string; calculatorIds: string[] }[];  // for Conversions
  published: boolean;    // hub rendered only if true and has ≥ 1 published calculator or intro
}
```

Ten categories: time-date, work-pay, construction, conversions, math, business, random, finance, health, everyday (`docs/03` §1). Published at launch: first five.

## Content collections (`src/content.config.ts`)

**calculators** (`src/content/calculators/<locale>/<slug>.mdx`)

| field | type | rule |
|---|---|---|
| calculatorId | string | must exist in registry (checked in `[slug].astro`) |
| locale | 'en' \| 'es' | |
| title | string | 1–60 chars |
| description | string | 120–155 chars |
| h1 | string | ≤ 70 |
| intro | string | one sentence, ≤ 200 |
| faq | {q,a}[] | ≥ 4 |
| sources | {name,url,date?}[] | ≥ 1 |
| author | string | authors collection id |
| reviewer | string? | required if ymyl |
| ymyl | boolean | default false |
| updated | date | |
| ogTitle | string? | ≤ 50 for OG image |

**categories** (`src/content/categories/<locale>/<slug>.mdx`): `title` ≤ 60, `description` 120–155, `h1`, `intro`, `faq` ≥ 3.

**authors** (`src/content/authors/<id>.md`): `name`, `role`, `credentials?`, `bio`, `sameAs: string[]`, `todo?: boolean` (placeholder flag shown as "TODO" in admin builds only).

**guides**: `title`, `description`, `updated`, `author`, `calculators: string[]` (empty collection for now).

## Gravel model (`src/calculators/gravel/types.ts`)

```ts
type Shape = 'rectangle' | 'circle' | 'triangle' | 'area';
type UnitSystem = 'imperial' | 'metric';

interface AreaInput {
  id: string;
  shape: Shape;
  a: number;      // length | diameter | base | area
  b?: number;     // width | height
  depth: number;  // in (imperial) or cm (metric)
}

interface GravelInput {
  units: UnitSystem;
  areas: AreaInput[];
  gravelTypeId: GravelTypeId | 'custom';
  customDensityLbFt3?: number;
  wastePct: number;          // 0–50, default 10
  bagSizeFt3: number;        // default 0.5
  price?: number;
  priceUnit?: 'yd3' | 'ton';
}

interface AreaResult { id: string; areaFt2: number; volumeFt3: number; volumeYd3: number; error?: string }

interface GravelResult {
  areas: AreaResult[];
  areaFt2: number;
  volumeFt3: number;  volumeYd3: number;  volumeM3: number;
  orderVolumeFt3: number; orderVolumeYd3: number; orderVolumeM3: number;   // with waste
  densityLbFt3: number; tonsPerYd3: number;
  weightLb: number; weightTons: number; weightKg: number; weightMetricTons: number;
  bags: number;
  cost?: number;
  steps: { label: string; expression: string; value: string }[];   // "How it's calculated"
}

interface GravelType { id: GravelTypeId; label: string; densityLbFt3: number; note: string; source: string }
```

Pure functions (`logic.ts`): `areaFt2(area, units)`, `volumeFt3(areaFt2, depth, units)`, `ft3ToYd3`, `yd3ToM3`, `lbToTons`, `lbToKg`, `tonsPerYd3(densityLbFt3)`, `bagsNeeded(ft3, bagSizeFt3)`, `cost(result, price, unit)`, `calculateGravel(input): GravelResult`, `coverageTable(densityLbFt3)` (ft² per ton at 1/2/3/4/6 in) and `DEFAULT_INPUT`.

## URL state (`src/lib/url-state.ts`)

Compact, human-readable: `?u=imp&a=rect:10:10:3;circ:8::2;tri:12:9:3;area:150::4&t=crushed-stone&d=105&w=10&bag=0.5&p=45&pu=yd3`.
Decoder tolerates missing/invalid parts (falls back to defaults). Canonical never includes params.

## Manifest (`dist/_registry.json`)

```json
[{ "id":"gravel", "slug":"gravel-calculator", "url":"/gravel-calculator/", "locale":"en", "category":"construction", "status":"published", "primaryKeyword":"gravel calculator", "island":"GravelCalculator" }]
```
Used by `seo-lint` (primary keyword uniqueness, island JS budget), `link-report` and Playwright.
