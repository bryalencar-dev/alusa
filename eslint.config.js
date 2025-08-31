// ESM flat config simplified
import js from '@eslint/js';
import * as tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  // Usando apenas recommended (sem exigir type info globalmente)
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  prettier,
  { ignores: ['**/dist/**'] },
  {
    files: ['**/tailwind.config.js','**/postcss.config.cjs','**/*.config.{js,cjs,mjs}'],
    languageOptions: { globals: { module: true, require: true, process: true } }
  },
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // por quê: reduzir fricção inicial em prototipagem de componentes reutilizáveis
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    },
    settings: { react: { version: 'detect' } }
  },
  // Override sem type-aware para libs internas adicionadas recentemente (evita erro de project include)
  {
    files: ['apps/web/lib/**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { project: null } }
  }
  // (Opcional futuramente) adicionar override tipado para src somente
];
