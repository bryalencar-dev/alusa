import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['first-user.spec.ts', 'smoke.spec.ts'],
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      TEST_ROUTES_ENABLED: 'true',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'testsecret'
    }
  }
});
