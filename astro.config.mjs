// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { buildLastmodMap } from './scripts/lib/lastmod.mjs';

// Domain is not decided yet (HANDOFF.md §5). Every absolute URL derives from SITE_URL.
const site = process.env.SITE_URL ?? 'https://example.com';
const lastmod = buildLastmodMap();

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always', // /gravel-calculator/
  build: { format: 'directory' },
  integrations: [
    preact(),
    mdx(),
    sitemap({
      // Search, 404, OG images and the machine-readable manifest are not for the index.
      filter: (page) => !/\/(404|search\/|og\/|registry\.json)/.test(page),
      serialize: (item) => {
        const url = new URL(item.url).pathname;
        const date = lastmod.get(url);
        if (date) item.lastmod = `${date}T00:00:00.000Z`;
        return item;
      },
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en-US', es: 'es-US' },
      },
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
