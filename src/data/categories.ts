/**
 * The 10 category hubs from docs/03-architecture.md §1.
 * Hubs drive the header menu, footer, breadcrumbs and /[category]/ pages.
 * `published: false` hubs are registered (for validation) but not rendered yet.
 */
export const CATEGORY_IDS = [
  'time-date',
  'work-pay',
  'construction',
  'conversions',
  'math',
  'business',
  'random',
  'finance',
  'health',
  'everyday',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface CategorySubgroup {
  id: string;
  name: string;
}

export interface Category {
  id: CategoryId;
  /** URL segment: /construction/ */
  slug: string;
  name: string;
  /** Short label for the header. */
  shortName: string;
  order: number;
  /** One line under the hub title and on category cards. */
  blurb: string;
  published: boolean;
  /** Optional grouping for large hubs (Conversions). Calculators opt in via meta.subgroup. */
  subgroups?: CategorySubgroup[];
}

export const categories: readonly Category[] = [
  {
    id: 'time-date',
    slug: 'time-date',
    name: 'Time & Date',
    shortName: 'Time & Date',
    order: 1,
    blurb: 'Durations, dates, countdowns and quick answers about the calendar.',
    published: true,
  },
  {
    id: 'work-pay',
    slug: 'work-pay',
    name: 'Work & Pay',
    shortName: 'Work & Pay',
    order: 2,
    blurb: 'Time cards, hours worked, overtime and pay conversions.',
    published: true,
  },
  {
    id: 'construction',
    slug: 'construction',
    name: 'Home & Construction',
    shortName: 'Construction',
    order: 3,
    blurb: 'Gravel, mulch, concrete, square footage and other material estimates.',
    published: true,
  },
  {
    id: 'math',
    slug: 'math',
    name: 'Math',
    shortName: 'Math',
    order: 4,
    blurb: 'Percentages, fractions and everyday arithmetic with worked steps.',
    published: true,
  },
  {
    id: 'conversions',
    slug: 'conversions',
    name: 'Unit Conversions',
    shortName: 'Conversions',
    order: 5,
    blurb: 'Length, weight, volume, temperature and cooking conversions with exact factors.',
    published: true,
    subgroups: [
      { id: 'length', name: 'Length & height' },
      { id: 'weight', name: 'Weight & mass' },
      { id: 'volume', name: 'Volume & cooking' },
      { id: 'temperature', name: 'Temperature' },
      { id: 'area', name: 'Area' },
      { id: 'time', name: 'Time' },
    ],
  },
  {
    id: 'business',
    slug: 'business',
    name: 'Business',
    shortName: 'Business',
    order: 6,
    blurb: 'Margin, markup, sales tax and small-business math.',
    published: false,
  },
  {
    id: 'random',
    slug: 'random',
    name: 'Generators',
    shortName: 'Generators',
    order: 7,
    blurb: 'Random numbers, dice, coin flips and pickers.',
    published: false,
  },
  {
    id: 'finance',
    slug: 'finance',
    name: 'Finance',
    shortName: 'Finance',
    order: 8,
    blurb: 'Loans, savings and interest, reviewed by finance professionals.',
    published: false,
  },
  {
    id: 'health',
    slug: 'health',
    name: 'Health & Fitness',
    shortName: 'Health',
    order: 9,
    blurb: 'Fitness and nutrition estimates, reviewed by qualified professionals.',
    published: false,
  },
  {
    id: 'everyday',
    slug: 'everyday',
    name: 'Everyday',
    shortName: 'Everyday',
    order: 10,
    blurb: 'Tips, fuel costs and other daily-life numbers.',
    published: false,
  },
];

export const categoryById = (id: CategoryId): Category => {
  const found = categories.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown category "${id}"`);
  return found;
};

export const categoryBySlug = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);

export const isCategoryId = (value: string): value is CategoryId =>
  (CATEGORY_IDS as readonly string[]).includes(value);
