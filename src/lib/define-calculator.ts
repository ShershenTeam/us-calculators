import type { CategoryId } from '@/data/categories';

export type Locale = 'en' | 'es';
export type Status = 'draft' | 'published';

export type ApplicationCategory =
  | 'UtilitiesApplication'
  | 'FinanceApplication'
  | 'HealthApplication'
  | 'EducationalApplication';

/**
 * Contract every calculator registers with in `src/calculators/<id>/meta.ts`.
 * Menus, hubs, breadcrumbs, related/next links, sitemap, hreflang and JSON-LD are
 * generated from these fields (docs/03-architecture.md §6). Nothing is hand-linked.
 */
export interface CalculatorMeta {
  /** Folder name. Immutable. */
  id: string;
  /** URL slugs per locale, without slashes: `gravel-calculator`. Immutable after publishing. */
  slugs: { en: string; es?: string };
  /** Main search query; must be unique across the registry (anti-cannibalisation). */
  primaryKeyword: string;
  /** Main hub (breadcrumbs). */
  category: CategoryId;
  /** Extra hubs where the card is also shown. */
  alsoIn?: CategoryId[];
  /** Optional subgroup id within the hub (see categories[].subgroups). */
  subgroup?: string;
  /** 4–6 thematically close calculators (ids). Backlinks are added automatically. */
  related: string[];
  /** 2–3 "what to calculate next" steps (ids). */
  next: string[];
  /** Synonyms for site search and anchors. */
  aliases: string[];
  ymyl: boolean;
  status: { en: Status; es?: Status };
  applicationCategory: ApplicationCategory;
  /** Previous slugs that must 301 to the current one. */
  redirectsFrom?: string[];
  /** Preact island component file in the calculator folder, e.g. `GravelCalculator`. */
  island?: string;
  /** Short line for cards and hub lists (≤ 90 chars). */
  blurb: string;
  /** Display name used in menus/cards, e.g. "Gravel Calculator". */
  name: string;
}

/** Identity helper that gives authors typed autocompletion. */
export function defineCalculator(meta: CalculatorMeta): CalculatorMeta {
  return meta;
}
