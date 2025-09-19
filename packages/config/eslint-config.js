export default {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint','react','react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
    'prettier'
  ],
  parserOptions: { project: ['./tsconfig.json','./apps/*/tsconfig.json','./packages/*/tsconfig.json'] },
  settings: { react: { version: 'detect' } },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    'react/prop-types': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@heroicons/react/24/outline',
            message: 'Importe ícones via \'@/components/icons/icons\' para padronizar.'
          },
          {
            name: '@heroicons/react/24/solid',
            message: 'Use o alias central e documente o uso de versão solid.'
          }
          ,{
            name: 'lucide-react',
            message: 'Biblioteca descontinuada neste projeto. Use ícones de @/components/icons.'
          }
        ]
      }
    ]
  }
};
