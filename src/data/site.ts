/**
 * Site-wide constants. The brand and domain are not decided yet (HANDOFF.md §5);
 * replace the TODO values in one place when they are.
 */
export const SITE_URL = (import.meta.env.SITE ?? 'https://example.com').replace(/\/$/, '');

export const site = {
  /** TODO(owner): brand name once the domain is chosen. */
  name: 'Calc Site',
  tagline: 'Free calculators, converters and quick answers — built for the U.S.',
  description:
    'Fast, mobile-first calculators for work hours, construction materials, percentages, unit conversions and dates. Every formula is tested against official sources.',
  locale: 'en-US',
  /** TODO(owner): real contact mailbox. */
  email: 'hello@example.com',
  /** TODO(owner): social profiles for Organization.sameAs. */
  sameAs: [] as string[],
  /** Year the site went live; used in footer copyright. */
  foundedYear: 2026,
  themeColor: { light: '#0f6e56', dark: '#101413' },
} as const;

export const nav = {
  /** Categories shown in the desktop header; the rest go under "More". */
  headerCategoryIds: ['time-date', 'work-pay', 'construction', 'math', 'conversions'] as const,
};

export const serviceLinks = [
  { href: '/about/', label: 'About' },
  { href: '/methodology/', label: 'Methodology' },
  { href: '/editorial-policy/', label: 'Editorial Policy' },
  { href: '/authors/', label: 'Authors' },
  { href: '/contact/', label: 'Contact' },
  { href: '/privacy/', label: 'Privacy' },
  { href: '/terms/', label: 'Terms' },
  { href: '/do-not-sell/', label: 'Do Not Sell or Share My Personal Information' },
] as const;
