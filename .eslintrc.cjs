module.exports = {
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  root: true,
  rules: {
    '@typescript-eslint/consistent-type-imports': ['error', { disallowTypeAnnotations: false, prefer: 'type-imports' }],
    '@typescript-eslint/naming-convention': [
      'error',
      { format: ['PascalCase'], prefix: ['E'], selector: 'enum' },
      { format: ['PascalCase'], prefix: ['I'], selector: 'interface' },
      { format: ['PascalCase'], prefix: ['T'], selector: 'typeAlias' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/no-duplicates': 'error',
    'import/no-unresolved': 'off',
    'import/order': [
      'error',
      {
        alphabetize: { caseInsensitive: true, order: 'asc' },
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        'newlines-between': 'always',
      },
    ],
    'no-console': 'off',
    'no-debugger': 'error',
    'prettier/prettier': ['error', { trailingComma: 'all' }],
    'sort-keys': ['off', 'asc', { caseSensitive: false, natural: true }],
    'sort-vars': 'error',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
};
