import eslint from '@eslint/js';
import fp from 'eslint-plugin-fp';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import tsEslint from 'typescript-eslint';
import jsoncPlugin from 'eslint-plugin-jsonc';
import * as jsoncEslintParser from 'jsonc-eslint-parser';

export default tsEslint.config(
  eslint.configs.recommended,
  tsEslint.configs.stylisticTypeChecked,
  fp.configs.recommended,
  { ignores: ['dist/', 'coverage/', 'vitest.config.ts'] },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'sort-destructure-keys': sortDestructureKeys,
      fp: fp,
    },
    rules: {
      'simple-import-sort/imports': 'warn',
      '@typescript-eslint/array-type': ['warn', { default: 'generic' }],
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/prefer-interface': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      'no-unused-vars': 'off',
      'sort-destructure-keys/sort-destructure-keys': 'error',
    },
  },
  {
    files: ['*.json5'],
    languageOptions: {
      parser: jsoncEslintParser,
    },
    ...jsoncPlugin.configs['flat/recommended-with-json5'],
  },
  {
    files: ['**/__tests__/**/*', '**/*.test.*'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      'fp/no-unused-expression': 'off',
      'fp/no-nil': 'off',
      'fp/no-let': 'off',
      'fp/no-mutation': 'off',
      'fp/no-mutating-methods': 'off',
      'fp/no-throw': 'off',
    },
  }
);
