import type { CalculatorMeta, Locale } from './define-calculator';
import { categories, categoryById, isCategoryId, type CategoryId } from '@/data/categories';

/**
 * Collects every `src/calculators/<id>/meta.ts` at build time and validates the graph.
 * Any violation throws, which fails `astro build` (Constitution III).
 */

export class RegistryError extends Error {
  constructor(message: string) {
    super(`[registry] ${message}`);
    this.name = 'RegistryError';
  }
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const modules = import.meta.glob<{ default: CalculatorMeta }>('../calculators/*/meta.ts', {
  eager: true,
});

function collect(): CalculatorMeta[] {
  const metas: CalculatorMeta[] = [];
  for (const [path, mod] of Object.entries(modules)) {
    const folder = path.split('/').at(-2);
    const meta = mod.default;
    if (!meta) throw new RegistryError(`${path}: missing default export`);
    if (meta.id !== folder) throw new RegistryError(`${path}: id "${meta.id}" must equal folder "${folder}"`);
    metas.push(meta);
  }
  return metas.sort((a, b) => a.name.localeCompare(b.name));
}

function validate(metas: CalculatorMeta[]): void {
  const ids = new Set<string>();
  const slugsEn = new Set<string>();
  const slugsEs = new Set<string>();
  const keywords = new Set<string>();

  for (const m of metas) {
    const where = `calculators/${m.id}/meta.ts`;

    if (ids.has(m.id)) throw new RegistryError(`${where}: duplicate id "${m.id}"`);
    ids.add(m.id);

    if (!SLUG_RE.test(m.slugs.en)) throw new RegistryError(`${where}: invalid en slug "${m.slugs.en}"`);
    if (slugsEn.has(m.slugs.en)) throw new RegistryError(`${where}: duplicate en slug "${m.slugs.en}"`);
    slugsEn.add(m.slugs.en);

    if (m.slugs.es) {
      if (!SLUG_RE.test(m.slugs.es)) throw new RegistryError(`${where}: invalid es slug "${m.slugs.es}"`);
      if (slugsEs.has(m.slugs.es)) throw new RegistryError(`${where}: duplicate es slug "${m.slugs.es}"`);
      slugsEs.add(m.slugs.es);
    }

    const kw = m.primaryKeyword.trim().toLowerCase();
    if (keywords.has(kw)) throw new RegistryError(`${where}: primary keyword "${m.primaryKeyword}" is already targeted by another calculator (cannibalisation)`);
    keywords.add(kw);

    if (!isCategoryId(m.category)) throw new RegistryError(`${where}: unknown category "${m.category}"`);
    for (const c of m.alsoIn ?? []) {
      if (!isCategoryId(c)) throw new RegistryError(`${where}: unknown alsoIn category "${c}"`);
      if (c === m.category) throw new RegistryError(`${where}: alsoIn repeats the main category "${c}"`);
    }
    if (m.subgroup) {
      const cat = categoryById(m.category);
      if (!cat.subgroups?.some((s) => s.id === m.subgroup)) {
        throw new RegistryError(`${where}: subgroup "${m.subgroup}" does not exist in category "${m.category}"`);
      }
    }
  }

  for (const m of metas) {
    const where = `calculators/${m.id}/meta.ts`;
    for (const field of ['related', 'next'] as const) {
      for (const ref of m[field]) {
        if (!ids.has(ref)) throw new RegistryError(`${where}: ${field} references unknown calculator "${ref}"`);
        if (ref === m.id) throw new RegistryError(`${where}: ${field} references itself`);
      }
    }
    if (m.status.en === 'published') {
      if (m.related.length < 4 || m.related.length > 6) {
        throw new RegistryError(`${where}: published calculators need 4–6 related (has ${m.related.length})`);
      }
      if (m.next.length < 2 || m.next.length > 3) {
        throw new RegistryError(`${where}: published calculators need 2–3 next (has ${m.next.length})`);
      }
      if (!m.island) throw new RegistryError(`${where}: published calculators need an island component`);
    }
    if (m.status.es === 'published' && !m.slugs.es) {
      throw new RegistryError(`${where}: es is published but slugs.es is missing`);
    }
  }
}

const all = collect();
validate(all);

const byIdMap = new Map(all.map((m) => [m.id, m]));

/** Symmetrised related graph: explicit links first, then backlinks, capped at 6. */
const relatedMap = new Map<string, string[]>();
for (const m of all) relatedMap.set(m.id, [...m.related]);
for (const m of all) {
  for (const ref of m.related) {
    const list = relatedMap.get(ref)!;
    if (!list.includes(m.id)) list.push(m.id);
  }
}

export interface CalculatorLink {
  id: string;
  name: string;
  blurb: string;
  url: string;
  slug: string;
}

function urlFor(m: CalculatorMeta, locale: Locale = 'en'): string {
  if (locale === 'es') {
    if (!m.slugs.es) throw new RegistryError(`${m.id}: no es slug`);
    return `/es/${m.slugs.es}/`;
  }
  return `/${m.slugs.en}/`;
}

function toLink(m: CalculatorMeta, locale: Locale = 'en'): CalculatorLink {
  return { id: m.id, name: m.name, blurb: m.blurb, url: urlFor(m, locale), slug: m.slugs[locale] ?? m.slugs.en };
}

function isPublished(m: CalculatorMeta, locale: Locale): boolean {
  return (m.status[locale] ?? 'draft') === 'published';
}

export const registry = {
  all(): readonly CalculatorMeta[] {
    return all;
  },

  published(locale: Locale = 'en'): CalculatorMeta[] {
    return all.filter((m) => isPublished(m, locale));
  },

  byId(id: string): CalculatorMeta {
    const m = byIdMap.get(id);
    if (!m) throw new RegistryError(`unknown calculator id "${id}"`);
    return m;
  },

  has(id: string): boolean {
    return byIdMap.has(id);
  },

  bySlug(slug: string, locale: Locale = 'en'): CalculatorMeta | undefined {
    return all.find((m) => m.slugs[locale] === slug);
  },

  /** Published calculators of a hub, including `alsoIn`, de-duplicated and sorted by name. */
  byCategory(categoryId: CategoryId, locale: Locale = 'en'): CalculatorMeta[] {
    return all.filter(
      (m) => isPublished(m, locale) && (m.category === categoryId || m.alsoIn?.includes(categoryId)),
    );
  },

  /** Categories that have at least one published calculator (for menus and the home page). */
  categoriesWithContent(locale: Locale = 'en') {
    return categories
      .filter((c) => c.published)
      .map((c) => ({ category: c, calculators: registry.byCategory(c.id, locale) }))
      .sort((a, b) => a.category.order - b.category.order);
  },

  relatedOf(id: string, locale: Locale = 'en'): CalculatorLink[] {
    return (relatedMap.get(id) ?? [])
      .map((r) => byIdMap.get(r)!)
      .filter((m) => isPublished(m, locale))
      .slice(0, 6)
      .map((m) => toLink(m, locale));
  },

  nextOf(id: string, locale: Locale = 'en'): CalculatorLink[] {
    return registry
      .byId(id)
      .next.map((n) => byIdMap.get(n)!)
      .filter((m) => isPublished(m, locale))
      .map((m) => toLink(m, locale));
  },

  url(id: string, locale: Locale = 'en'): string {
    return urlFor(registry.byId(id), locale);
  },

  /** Resolve a `<Calc slug>` reference; throws so the build fails on typos. */
  linkBySlug(slug: string, locale: Locale = 'en'): CalculatorLink {
    const m = registry.bySlug(slug, locale);
    if (!m) throw new RegistryError(`<Calc slug="${slug}"> does not match any calculator`);
    return toLink(m, locale);
  },

  breadcrumbs(id: string, locale: Locale = 'en'): { name: string; url: string }[] {
    const m = registry.byId(id);
    const cat = categoryById(m.category);
    const prefix = locale === 'es' ? '/es' : '';
    return [
      { name: locale === 'es' ? 'Inicio' : 'Home', url: `${prefix}/` },
      { name: cat.name, url: `${prefix}/${cat.slug}/` },
      { name: m.name, url: urlFor(m, locale) },
    ];
  },

  /** hreflang alternates, only for locales that are published. */
  hreflang(id: string): Record<string, string> {
    const m = registry.byId(id);
    const out: Record<string, string> = {};
    if (isPublished(m, 'en')) out['en-US'] = urlFor(m, 'en');
    if (isPublished(m, 'es')) out['es-US'] = urlFor(m, 'es');
    if (out['en-US']) out['x-default'] = out['en-US'];
    return out;
  },

  /** Machine-readable manifest for scripts/ (seo-lint, link-report, Playwright). */
  manifest() {
    return all.flatMap((m) => {
      const rows = [] as Array<Record<string, string>>;
      for (const locale of ['en', 'es'] as Locale[]) {
        if (!m.slugs[locale]) continue;
        rows.push({
          id: m.id,
          locale,
          slug: m.slugs[locale]!,
          url: urlFor(m, locale),
          category: m.category,
          status: m.status[locale] ?? 'draft',
          primaryKeyword: m.primaryKeyword,
          island: m.island ?? '',
        });
      }
      return rows;
    });
  },
};

export type Registry = typeof registry;
