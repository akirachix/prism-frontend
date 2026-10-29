import { defineConfig, devices } from "@playwright/test";

const shared = {
  serviceWorkers: "block" as const,
  locale: "en-KE",
  timezoneId: "Africa/Nairobi",
  trace: "on-first-retry" as const,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://localhost:3200", ...shared },
  projects: [
    {
      name: "desktop",
      testMatch: [
        "auth/**/*.spec.ts",
        "teacher/**/*.spec.ts",
        "shared/**/*.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"], ...shared },
    },
    {
      name: "mobile",
      testMatch: ["parent/**/*.spec.ts"],
      use: { ...devices["Pixel 7"], ...shared },
    },
  ],
  webServer: {
    command: "npm run build && npx next start -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_API_URL: "http://api.test",
      NEXT_PUBLIC_SCREENING_ENABLED: "true",
    },
  },
});
