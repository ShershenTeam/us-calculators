import { SITE_URL, site } from '@/data/site';

export const abs = (path: string): string => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export interface Crumb {
  name: string;
  url: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** JSON-LD builders (docs/07-seo-checklist.md A3). All URLs absolute. */
export const jsonLd = {
  organization() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      url: abs('/'),
      logo: abs('/favicon.svg'),
      ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
    };
  },

  webSite() {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: abs('/'),
      inLanguage: site.locale,
    };
  },

  breadcrumbs(crumbs: Crumb[]) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: abs(c.url),
      })),
    };
  },

  webApplication(opts: {
    name: string;
    url: string;
    description: string;
    applicationCategory: string;
    updated: Date;
    author?: { name: string; url?: string };
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: opts.name,
      url: abs(opts.url),
      description: opts.description,
      applicationCategory: opts.applicationCategory,
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript for live results; a worked example is shown without it.',
      inLanguage: site.locale,
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      dateModified: opts.updated.toISOString().slice(0, 10),
      publisher: { '@type': 'Organization', name: site.name, url: abs('/') },
      ...(opts.author
        ? { author: { '@type': 'Person', name: opts.author.name, ...(opts.author.url ? { url: abs(opts.author.url) } : {}) } }
        : {}),
    };
  },

  /** Only for FAQ that is visible on the page. */
  faqPage(items: FaqItem[]) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
  },
};

/** Strip markdown-ish inline syntax from FAQ answers for JSON-LD text. */
export function plainText(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
