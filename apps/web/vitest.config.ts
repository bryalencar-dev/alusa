import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: { provider: 'v8' },
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'tests/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'tests/**/*password-policy.test.ts'
    ],
    exclude: [
      'tests/e2e/**',
      'node_modules/**',
      'dist/**',
      '../../packages/**'
    ],
    setupFiles: [path.resolve(__dirname, 'test', 'setup.ts')]
  },
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      './app/globals.css': path.resolve(__dirname, 'vitest-empty.css'),
      '@': path.resolve(__dirname)
    }
  }
});
