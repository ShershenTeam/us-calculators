/**
 * Copies the two self-hosted variable font subsets from node_modules into
 * public/fonts/ so <link rel="preload"> and @font-face can use stable paths
 * (src/components/Head.astro, src/styles/global.css).
 *
 * Runs before every build; also run it by hand after upgrading a font package:
 *   npm run fonts
 */
import { createRequire } from 'node:module';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'fonts');

const FILES = [
  '@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2',
  '@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2',
];

await mkdir(outDir, { recursive: true });

for (const spec of FILES) {
  const from = require.resolve(spec);
  const name = spec.split('/').pop();
  const to = join(outDir, name);
  await copyFile(from, to);
  const { size } = await stat(to);
  console.log(`fonts: ${name} (${(size / 1024).toFixed(1)} kB)`);
}
