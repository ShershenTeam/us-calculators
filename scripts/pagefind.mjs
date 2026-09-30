// Builds the Pagefind search index after `astro build`.
// Stage B: a failed index (e.g. no network to fetch the binary) only warns, so the
// site still builds. Stage D (CI) sets PAGEFIND_STRICT=1 to make it fatal.
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx', ['pagefind', '--site', 'dist'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  const message = `pagefind exited with status ${result.status ?? 'unknown'}`;
  if (process.env.PAGEFIND_STRICT === '1') {
    console.error(message);
    process.exit(result.status ?? 1);
  }
  console.warn(`[warn] ${message}. Site search will be unavailable in this build.`);
}
