# Quickstart

```bash
npm install                     # Node 22+; installs Astro, Preact, Tailwind, Vitest, Playwright
npx playwright install chromium # once, for e2e
cp .env.example .env            # set SITE_URL when the domain is known

npm run dev                     # http://localhost:4321
npm run check                   # astro check (types + templates)
npm test                        # vitest: calculator logic
npm run build                   # astro build + pagefind index → dist/
npm run seo-lint                # SEO rules over dist/
npm run links                   # internal link report over dist/
npm run test:e2e                # Playwright mobile smoke against astro preview
```

## Add a calculator

```bash
npm run new mulch               # creates src/calculators/mulch/{meta.ts,logic.ts,logic.test.ts,MulchCalculator.tsx}
                                #   and src/content/calculators/en/mulch-calculator.mdx from templates
```
1. Fill the brief `docs/briefs/mulch-calculator.md` first (Constitution I).
2. Write `logic.ts` + ≥ 5 tests → `npm test`.
3. Build the island from `src/components/ui/*`.
4. Write the MDX; link other calculators with `<Calc slug="gravel-calculator">gravel</Calc>`.
5. Set `meta.ts`: `category`, `related` (4–6), `next` (2–3), `aliases`, `status.en: 'published'`.
6. `npm run build && npm run seo-lint && npm run links && npm run test:e2e`.
7. Update `Page_Plan_12_months.xlsx` → Status = Published.

Menus, hub cards, breadcrumbs, related backlinks, sitemap and JSON-LD update automatically.
