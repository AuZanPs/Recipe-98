import { defineConfig, devices } from '@playwright/test';

// Runs against the built site so the production CSP and prerendered HTML are
// what get exercised.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4398',
    trace: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx astro preview --port 4398 --host 127.0.0.1',
    url: 'http://127.0.0.1:4398',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
