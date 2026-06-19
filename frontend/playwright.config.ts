import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,

  use: {
    baseURL: process.env.BASE_URL || "http://localhost",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
})
