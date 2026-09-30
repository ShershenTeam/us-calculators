## What

<!-- One or two sentences: which page(s) or part of the site this changes. -->

## Checklist (docs/10-build-guide.md C7 · docs/07-seo-checklist.md B)

- [ ] Brief completed and linked: `docs/briefs/<slug>.md` (3 concrete advantages over the top-3)
- [ ] `logic.ts` is pure; `logic.test.ts` has ≥ 5 reference examples, ≥ 2 from a primary source, plus edge cases
- [ ] Sources listed in frontmatter (`sources`), author and `updated` set; reviewer set if `ymyl: true`
- [ ] FAQ ≥ 4 from real questions (PAA, forums); H2s answer real questions
- [ ] `meta.ts`: `category`, `related` (4–6), `next` (2–3), `aliases`, `primaryKeyword` unique
- [ ] ≥ 3 `<Calc>` links in the text; new page linked from 2–3 existing pages
- [ ] Checked at 375 px: calculator above the fold, result updates while typing, no horizontal scroll
- [ ] `npm run verify && npm run test:e2e` green locally
- [ ] `Page_Plan_12_months.xlsx` → Status updated

## Mobile screenshot

<!-- Drag a 375 px screenshot here (test-results/*.png from Playwright works). -->

## Brief

<!-- Link to docs/briefs/<slug>.md -->
