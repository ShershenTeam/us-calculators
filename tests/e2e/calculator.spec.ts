import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// docs/06-mobile.md §8 and docs/07 B3: every published calculator on iPhone SE and Pixel 7.
type Row = { url: string; status: string; locale: string };
const manifest: Row[] = JSON.parse(readFileSync('dist/registry.json', 'utf8'));
const calculators = manifest.filter((m) => m.status === 'published');

for (const calc of calculators) {
  test.describe(calc.url, () => {
    test('calculator is above the fold with a default result', async ({ page }) => {
      await page.goto(calc.url);
      const viewport = page.viewportSize()!;
      const block = page.locator('[data-calculator]');
      await expect(block).toBeVisible();
      const box = await block.boundingBox();
      expect(box, 'calculator block has a box').not.toBeNull();
      expect(box!.y, 'calculator starts inside the first screen').toBeLessThan(viewport.height * 0.75);

      const firstInput = block.locator('input').first();
      const inputBox = await firstInput.boundingBox();
      expect(inputBox!.y + inputBox!.height, 'first input fully inside the first screen').toBeLessThanOrEqual(viewport.height);

      const result = page.getByTestId('primary-result');
      await expect(result).not.toHaveText('');
      await expect(result).not.toHaveText('—');
    });

    test('result changes as the user types', async ({ page }) => {
      await page.goto(calc.url);
      const result = page.getByTestId('primary-result');
      const before = await result.textContent();
      const input = page.locator('[data-calculator] input').first();
      await input.fill('');
      await input.fill('123');
      await expect(result).not.toHaveText(before!);
      await expect(page).toHaveURL(/\?/); // state written to URL
    });

    test('no horizontal scroll', async ({ page }) => {
      await page.goto(calc.url);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('inputs use a numeric keyboard and have labels', async ({ page }) => {
      await page.goto(calc.url);
      const inputs = page.locator('[data-calculator] input[type="text"]');
      const n = await inputs.count();
      expect(n).toBeGreaterThan(0);
      for (let i = 0; i < n; i++) {
        const el = inputs.nth(i);
        expect(['decimal', 'numeric']).toContain(await el.getAttribute('inputmode'));
        const id = await el.getAttribute('id');
        await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
      }
    });

    test('screenshot', async ({ page }, info) => {
      await page.goto(calc.url);
      await page.screenshot({ path: `test-results/${info.project.name}${calc.url.replace(/\//g, '_')}.png`, fullPage: false });
    });
  });
}
