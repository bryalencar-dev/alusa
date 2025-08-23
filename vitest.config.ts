import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@alusa/lib': path.resolve(__dirname, 'packages/lib/src/index.ts'),
  '@alusa/lib/': path.resolve(__dirname, 'packages/lib/src/'),
  '@alusa/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
  '@alusa/ui/': path.resolve(__dirname, 'packages/ui/src/')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  include: ['apps/web/tests/unit/**/*.test.ts', 'packages/lib/__tests__/**/*.test.ts', 'packages/ui/src/__tests__/**/*.test.ts?(x)']
  }
});