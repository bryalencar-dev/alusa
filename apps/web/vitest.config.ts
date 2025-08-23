import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'tests/integration/**/*.{test,spec}.{ts,tsx}'],
  environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/*.skip.ts',
  '**/*.skip.tsx',
  '**/login-session.test.ts'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app'),
    }
  }
});
