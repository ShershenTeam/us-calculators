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
let fontCache: Promise<ArrayBuffer> | undefined;
function loadFont(): Promise<ArrayBuffer> {
  fontCache ??= readFile(require.resolve('@fontsource/inter/files/inter-latin-700-normal.woff')).then(
    (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer,
  );
  return fontCache;
}

export const GET: APIRoute = async ({ props }) => {
  const { title, kicker } = props as OgProps;
  const fontData = await loadFont();

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
          padding: '72px',
          background: 'linear-gradient(135deg, #0b5642 0%, #0f6e56 60%, #15866a 100%)',
          color: '#ffffff',
          fontFamily: 'Inter',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '18px', fontSize: '34px', opacity: 0.9 },
              children: [
                { type: 'div', props: { style: { width: '40px', height: '40px', borderRadius: '10px', background: '#dff3ea' } } },
                { type: 'div', props: { children: kicker } },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: { fontSize: title.length > 40 ? '64px' : '80px', lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.02em' },
              children: title,
            },
          },
          {
            type: 'div',
            props: {
              style: { fontSize: '28px', opacity: 0.85 },
              children: 'Free · instant result · works on your phone',
            },
          },
        ],
      },
    },
    { width: 1200, height: 630, fonts: [{ name: 'Inter', data: fontData, weight: 700, style: 'normal' }] },
  );

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
