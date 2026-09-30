import { defineConfig, devices } from '@playwright/test';

// Mobile smoke tests from docs/06-mobile.md §8: iPhone SE 375×667 and Pixel 7 412×915.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // 127.0.0.1 explicitly: on Linux runners "localhost" may resolve to ::1 while the server binds IPv4.
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    // iPhone SE viewport emulated in Chromium (WebKit needs a separate ~100 MB download; stage D may add it).
    { name: 'iphone-se', use: { ...devices['iPhone SE (3rd gen)'], browserName: 'chromium' } },
    { name: 'small-320', use: { ...devices['iPhone SE'], browserName: 'chromium' } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
  ],
});
