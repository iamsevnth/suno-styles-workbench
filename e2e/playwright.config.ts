import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const PORT = 4173;

/**
 * Browser smoke and accessibility tests against the production build in dist/, served the way
 * GitHub Pages serves it (clean URLs). Run `npm run build` first; `npm run test:browser` then
 * starts e2e/serve-dist.mjs itself.
 */
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['html', { open: 'never', outputFolder: '../playwright-report' }]] : 'list',
  outputDir: '../test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node e2e/serve-dist.mjs dist',
    cwd: '..',
    url: `http://127.0.0.1:${PORT}/`,
    env: { PORT: String(PORT) },
    reuseExistingServer: !isCI,
    timeout: 30_000,
  },
});
