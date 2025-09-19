import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: { provider: 'v8' },
    deps: {
      inline: [/^@alusa\/lib/]
    },
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'tests/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'tests/**/*password-policy.test.ts'
    ],
    exclude: [
      'tests/e2e/**',
      'node_modules/**',
      'dist/**'
    ],
    setupFiles: [path.resolve(__dirname, 'test', 'setup.ts')]
  },
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: [
      { find: './app/globals.css', replacement: path.resolve(__dirname, 'vitest-empty.css') },
      { find: '@/prisma/client', replacement: path.resolve(__dirname, 'prisma', 'client.ts') },
      { find: '@', replacement: path.resolve(__dirname) }
    ]
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..', '..'), __dirname]
    }
  }
});
