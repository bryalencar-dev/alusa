module.exports = {
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
  parserOptions: { project: ['./tsconfig.json','./apps/*/tsconfig.json','./packages/*/tsconfig.json'], tsconfigRootDir: __dirname },
  settings: { react: { version: 'detect' } },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    'react/prop-types': 'off'
  }
};
