import { defineConfig, devices } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

type BrowserProjectName = 'chromium' | 'firefox' | 'webkit';

type BrowserOverrideConfig = {
  sharedUse?: Record<string, unknown>;
  projects?: Partial<Record<BrowserProjectName, Record<string, unknown>>>;
};

function resolveOptionalStorageStatePath(): string | undefined {
  const configuredPath = process.env.PW_STORAGE_STATE_PATH?.trim();

  if (configuredPath) {
    const absolutePath = path.resolve(configuredPath);
    return existsSync(absolutePath) ? absolutePath : undefined;
  }

  const defaultPath = path.resolve('playwright.storage-state.json');
  return existsSync(defaultPath) ? defaultPath : undefined;
}

function loadBrowserOverrideConfig(): BrowserOverrideConfig {
  const configuredPath = process.env.PW_BROWSER_CONFIG_PATH?.trim();
  const fallbackPath = path.resolve('playwright.browser.config.json');
  const targetPath = configuredPath ? path.resolve(configuredPath) : fallbackPath;

  if (!existsSync(targetPath)) {
    return {};
  }

  try {
    const raw = readFileSync(targetPath, 'utf-8');
    return JSON.parse(raw) as BrowserOverrideConfig;
  } catch {
    console.warn(`[playwright-config] Failed to parse browser override config: ${targetPath}`);
    return {};
  }
}

const storageStatePath = resolveOptionalStorageStatePath();
const browserOverrideConfig = loadBrowserOverrideConfig();
const configuredWorkers = Number(process.env.PW_WORKERS);
const defaultWorkers = process.env.CI ? 1 : 5;

function projectUse(name: BrowserProjectName, defaults: Record<string, unknown>): Record<string, unknown> {
  return {
    ...defaults,
    ...(browserOverrideConfig.sharedUse ?? {}),
    ...(browserOverrideConfig.projects?.[name] ?? {}),
  };
}


/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  /* Keep tests deterministic under stress runs (repeat-each) by avoiding file-level race amplification. */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Disable retries so failures surface immediately and can be fixed deterministically. */
  retries: 0,
  /* Use lower default worker count locally to reduce browser-engine flakiness under heavy repeat mode. */
  workers: Number.isFinite(configuredWorkers) && configuredWorkers > 0 ? configuredWorkers : defaultWorkers,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    ['html'],
    ['allure-playwright', { outputFolder: 'allure-results', cleanResultsDir: true }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    headless: process.env.PW_HEADLESS ? process.env.PW_HEADLESS !== 'false' : true,
    storageState: storageStatePath,
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'https://medicare-flow-bot.lovable.app/',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: projectUse('chromium', { ...devices['Desktop Chrome'] }),
    },

     {
       name: 'firefox',
      use: projectUse('firefox', { ...devices['Desktop Firefox'] }),
     },

    {
      name: 'webkit',
      use: projectUse('webkit', { ...devices['Desktop Safari'] }),
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
