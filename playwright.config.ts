import { defineConfig, devices } from "@playwright/test";
import {
  TEST_DB_URL,
  TEST_SERVER_PORT,
  TEST_CLIENT_PORT,
  TEST_BETTER_AUTH_URL,
} from "./e2e/test-config.ts";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/test-results",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [["html", { outputFolder: "./e2e/playwright-report" }]],

  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: `http://localhost:${TEST_CLIENT_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
  },

  expect: {
    timeout: 10_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "bun run start",
      cwd: "./server",
      port: TEST_SERVER_PORT,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...(process.env as Record<string, string>),
        DATABASE_URL: TEST_DB_URL,
        PORT: String(TEST_SERVER_PORT),
        BETTER_AUTH_URL: TEST_BETTER_AUTH_URL,
        ALLOWED_ORIGINS: `http://localhost:${TEST_CLIENT_PORT}`,
        TRUSTED_ORIGINS: `http://localhost:${TEST_CLIENT_PORT}`,
      },
    },
    {
      command: `bun run dev -- --port ${TEST_CLIENT_PORT}`,
      cwd: "./client",
      port: TEST_CLIENT_PORT,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...(process.env as Record<string, string>),
        API_PROXY_TARGET: `http://localhost:${TEST_SERVER_PORT}`,
      },
    },
  ],
});
