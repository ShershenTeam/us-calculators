import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';
import { registry } from '@/lib/registry';
import { categories } from '@/data/categories';
import { site } from '@/data/site';

/**
 * Open Graph images, generated at build time (docs/07 A1): one per calculator,
 * one per hub, plus /og/default.png.
 */

type OgProps = { title: string; kicker: string; [key: string]: unknown };

export const getStaticPaths = (async () => {
  const calcs = await getCollection('calculators', (e) => e.data.locale === 'en');
  const paths: { params: { slug: string }; props: OgProps }[] = [
    { params: { slug: 'default' }, props: { title: site.tagline, kicker: site.name } },
  ];
  for (const c of categories.filter((c) => c.published && registry.byCategory(c.id, 'en').length > 0)) {
    paths.push({ params: { slug: `hub-${c.slug}` }, props: { title: `${c.name} calculators`, kicker: site.name } });
  }
  for (const meta of registry.published('en')) {
    const entry = calcs.find((e) => e.data.calculatorId === meta.id);
    paths.push({
      params: { slug: meta.slugs.en },
      props: { title: entry?.data.ogTitle ?? entry?.data.h1 ?? meta.name, kicker: site.name },
    });
  }
  return paths;
}) satisfies GetStaticPaths;

const require = createRequire(import.meta.url);

/** The two site faces, as static .woff files satori can parse. */
const FONT_FILES = {
  sans: '@fontsource/public-sans/files/public-sans-latin-600-normal.woff',
  serif: '@fontsource/newsreader/files/newsreader-latin-600-normal.woff',
} as const;

const fontCache = new Map<keyof typeof FONT_FILES, Promise<ArrayBuffer>>();
function loadFont(key: keyof typeof FONT_FILES): Promise<ArrayBuffer> {
  let p = fontCache.get(key);
  if (!p) {
    p = readFile(require.resolve(FONT_FILES[key])).then(
      (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer,
    );
    fontCache.set(key, p);
  }
  return p;
}

/* Colours mirror the light tokens in src/styles/global.css (docs/11 §2). */
const PAPER = '#f8f6f0';
const INK = '#17251f';
const MUTED = '#5c6a63';
const GREEN = '#0e5f4a';
const RULE = '#cfcabb';
const OCHRE = '#c07a16';

export const GET: APIRoute = async ({ props }) => {
  const { title, kicker } = props as OgProps;
  const [sans, serif] = await Promise.all([loadFont('sans'), loadFont('serif')]);

  /** A row of ruler ticks across the top edge — the site's signature detail. */
  const ticks = {
    type: 'div',
    props: {
      style: { display: 'flex', gap: '11px', height: '14px' },
      children: Array.from({ length: 64 }, (_, i) => ({
        type: 'div',
        props: {
          style: {
            width: '2px',
            height: i % 5 === 0 ? '14px' : '7px',
            background: i % 5 === 0 ? GREEN : RULE,
          },
        },
      })),
    },
  };

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: PAPER,
          color: INK,
          fontFamily: 'Public Sans',
          borderBottom: `14px solid ${GREEN}`,
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '34px' },
              children: [
                ticks,
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '25px',
                      letterSpacing: '4px',
                      textTransform: 'uppercase',
                      color: MUTED,
                    },
                    children: [
                      { type: 'div', props: { style: { width: '14px', height: '14px', background: OCHRE } } },
                      { type: 'div', props: { children: kicker } },
                    ],
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontFamily: 'Newsreader',
                fontSize: title.length > 44 ? '70px' : '86px',
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                maxWidth: '950px',
              },
              children: title,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '27px',
                color: MUTED,
                borderTop: `2px solid ${RULE}`,
                paddingTop: '26px',
              },
              children: [
                { type: 'div', props: { children: 'Free' } },
                { type: 'div', props: { style: { color: RULE }, children: '·' } },
                { type: 'div', props: { children: 'Answer as you type' } },
                { type: 'div', props: { style: { color: RULE }, children: '·' } },
                { type: 'div', props: { children: 'Formulas tested against official sources' } },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Public Sans', data: sans, weight: 600, style: 'normal' },
        { name: 'Newsreader', data: serif, weight: 600, style: 'normal' },
      ],
    },
  );

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
