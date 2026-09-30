import type { APIRoute } from 'astro';
import { registry } from '@/lib/registry';

/** Machine-readable manifest for scripts/seo-lint.mjs, scripts/link-report.mjs and Playwright. */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(registry.manifest(), null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
