import { defineConfig, devices } from '@playwright/test';

// Mobile smoke tests from docs/06-mobile.md §8: iPhone SE 375×667 and Pixel 7 412×915.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host localhost --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: 'iphone-se', use: { ...devices['iPhone SE'] } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
  ],
});
