import { test, expect } from '@playwright/test';

const pages = ['/', '/construction/', '/about/', '/methodology/', '/editorial-policy/', '/authors/', '/contact/', '/privacy/', '/terms/', '/do-not-sell/'];

for (const url of pages) {
  test(`${url} renders with one H1, canonical and no horizontal scroll`, async ({ page }) => {
    const res = await page.goto(url);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(new RegExp(`${url.replace(/\//g, '\\/')}$`));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('404 page returns 404 and offers search', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('form[role="search"] input').first()).toBeVisible();
});

test('mobile menu opens and lists categories', async ({ page }) => {
  await page.goto('/');
  const burger = page.locator('header details > summary').first();
  if (await burger.isVisible()) {
    await burger.click();
    await expect(page.locator('header nav[aria-label="Categories"] a[href="/construction/"]').first()).toBeVisible();
  }
});
