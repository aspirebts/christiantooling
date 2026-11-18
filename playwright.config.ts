import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

/**
 * Two modes:
 *
 * 1. Smoke (default, used in CI): a production build in SAFE LOCAL MODE.
 *    Supabase variables are cleared so the suite never touches a real project.
 *
 * 2. Full stack (E2E_FULL_STACK=1): real sign-up, email confirmation, profile
 *    and role management against the LOCAL Supabase stack (`npm run db:start`).
 *    Uses the Supabase values in .env.local plus E2E_SUPABASE_SERVICE_ROLE_KEY
 *    (from `npx supabase status -o env`). Never point this at production.
 *
 * Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to reuse a preinstalled Chromium.
 */
const fullStack = process.env.E2E_FULL_STACK === "1";

export default defineConfig({
  testDir: "./e2e",
  testMatch: fullStack ? "full-stack/**/*.spec.ts" : "**/*.spec.ts",
  testIgnore: fullStack ? undefined : "**/full-stack/**",
  fullyParallel: !fullStack,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "off",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    },
  },
  projects: fullStack
    ? [{ name: "full-stack", use: { ...devices["Desktop Chrome"] } }]
    : [
        { name: "desktop", use: { ...devices["Desktop Chrome"] } },
        { name: "mobile", use: { ...devices["Pixel 7"] } },
      ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: fullStack
      ? { NEXT_PUBLIC_SITE_URL: baseURL }
      : {
          NEXT_PUBLIC_SUPABASE_URL: "",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
          NEXT_PUBLIC_SITE_URL: baseURL,
        },
  },
});
