import baseConfig from '@konker.dev/common-config/configs/eslint.config-base.mjs';

export default [
  ...baseConfig,
  {
    ignores: ['vitest.config.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.{ts,js}'],
    rules: {
      'fp/no-let': 'off',
      'fp/no-loops': 'off',
      'fp/no-mutation': 'off',
      'fp/no-mutating-methods': 'off',
      'fp/no-nil': 'off',
      'fp/no-rest-parameters': 'off',
      'fp/no-unused-expression': 'off',
    },
  },
];
