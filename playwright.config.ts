import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/tests/e2e',
  timeout: 60_000,
  globalSetup: './tests/e2e-global-setup.ts',
  webServer: {
    command: 'pnpm dev:web',
    // Rota pública de login (segmento de pasta '(auth)' não aparece na URL final do App Router)
    url: 'http://localhost:3000/login',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'testsecret',
      // Usa variável existente se definida, senão tenta fallback padrão
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