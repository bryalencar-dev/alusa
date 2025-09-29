import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  // Permite rodar qualquer *.spec.ts dentro de e2e/ ou tests/e2e/
  testMatch: ['e2e/**/*.spec.ts', 'tests/e2e/**/*.spec.ts'],
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: '3001',
      TEST_ROUTES_ENABLED: 'true',
      NEXTAUTH_URL: 'http://localhost:3001',
      NEXTAUTH_SECRET: 'testsecret',
    },
  },
});
