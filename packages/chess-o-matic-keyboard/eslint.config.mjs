import baseConfig from '@konker.dev/common-config/configs/eslint.config-base.mjs';

export default [
  ...baseConfig,
  {
    ignores: ['dist/', 'coverage/', 'vitest.config.ts', 'tsup.config.ts'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/solid/**/*.{ts,tsx}'],
    rules: {
      'fp/no-class': 'off',
      'fp/no-let': 'off',
      'fp/no-mutation': 'off',
      'fp/no-mutating-methods': 'off',
      'fp/no-unused-expression': 'off',
    },
  },
];
