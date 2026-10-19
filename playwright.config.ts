import { defineConfig, devices } from '@playwright/test';
import { config } from './api-test.config';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

// The public demo server loads the UI through several sequential API calls (session, roles, settings, data);
// under parallel load these take longer than the default 5s, so UI assertions get 10s and UI tests 90s
// (a multi-page flow makes 10+ such round trips).
const uiExpectTimeout = 10_000
const uiTestTimeout = 90_000

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  // A local InvenTree (TEST_ENV=local) is fast enough for parts created in parallel to collide in its part tree
  // (duplicate MPTT tree ids, then deadlocks and 500s), so the local server runs one test at a time.
  workers: process.env.CI || process.env.TEST_ENV === 'local' ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['list']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: config.baseUrl,
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [

    {
      name: 'api-testing',
      testDir: './tests/api-tests',
    },

    {
      name: 'ui-auth-setup',
      testDir: './tests/ui-tests',
      testMatch: /auth\.setup\.ts/,
      expect: { timeout: uiExpectTimeout },
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'ui-engineer',
      testDir: './tests/ui-tests/engineer',
      expect: { timeout: uiExpectTimeout },
      timeout: uiTestTimeout,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright-utils/ui/.auth/engineer.json',
      },
      dependencies: ['ui-auth-setup'],
    },

    {
      name: 'ui-stock',
      testDir: './tests/ui-tests/stock',
      expect: { timeout: uiExpectTimeout },
      timeout: uiTestTimeout,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright-utils/ui/.auth/stock.json',
      },
      dependencies: ['ui-auth-setup'],
    },

    {
      name: 'ui-reader',
      testDir: './tests/ui-tests/reader',
      expect: { timeout: uiExpectTimeout },
      timeout: uiTestTimeout,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright-utils/ui/.auth/reader.json',
      },
      dependencies: ['ui-auth-setup'],
    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

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
