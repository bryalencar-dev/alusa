import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/tests/e2e',
  timeout: 60_000,
  globalSetup: './tests/e2e-global-setup.ts',
  webServer: {
    command: 'pnpm dev:web',
    url: 'http://localhost:3000/login',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NODE_ENV: 'development',
      TEST_ROUTES_ENABLED: 'true',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'dev-test-secret',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:alusa@localhost:5432/alusa?schema=public'
    }
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});