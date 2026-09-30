import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content schemas (docs/04-tech-and-deploy.md §2, docs/07 B2/B4).
 * The build fails when a limit is exceeded — that is the point.
 */

const faq = z.object({
  q: z.string().min(8).max(160),
  a: z.string().min(20),
});

const source = z.object({
  name: z.string().min(3),
  url: z.url(),
  /** When the source was last checked. */
  date: z.coerce.date().optional(),
});

const seoFields = {
  title: z.string().min(10).max(60),
  description: z.string().min(120).max(155),
  h1: z.string().min(3).max(70),
  /** One sentence shown under the H1; should answer the query directly. */
  intro: z.string().min(40).max(220),
};

const calculators = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/calculators' }),
  schema: z
    .object({
      ...seoFields,
      calculatorId: z.string().min(1),
      locale: z.enum(['en', 'es']),
      faq: z.array(faq).min(4).max(10),
      sources: z.array(source).min(1),
      author: z.string().min(1),
      reviewer: z.string().min(1).optional(),
      ymyl: z.boolean().default(false),
      updated: z.coerce.date(),
      /** Shorter title for the generated OG image. */
      ogTitle: z.string().max(50).optional(),
    })
    .superRefine((v, ctx) => {
      if (v.ymyl && !v.reviewer) {
        ctx.addIssue({ code: 'custom', path: ['reviewer'], message: 'YMYL pages require a reviewer' });
      }
    }),
});

const categories = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/categories' }),
  schema: z.object({
    ...seoFields,
    categoryId: z.string().min(1),
    locale: z.enum(['en', 'es']),
    faq: z.array(faq).min(3).max(8),
    updated: z.coerce.date(),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/authors' }),
  schema: z.object({
    name: z.string().min(2),
    role: z.string().min(2),
    credentials: z.string().optional(),
    bio: z.string().min(40),
    sameAs: z.array(z.url()).default([]),
    /** Placeholder until the owner provides real people. Rendered with a visible note. */
    placeholder: z.boolean().default(false),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: z.object({
    ...seoFields,
    locale: z.enum(['en', 'es']),
    author: z.string(),
    updated: z.coerce.date(),
    calculators: z.array(z.string()).default([]),
  }),
});

export const collections = { calculators, categories, authors, guides };
