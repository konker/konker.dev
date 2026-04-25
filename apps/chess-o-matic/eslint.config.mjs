import baseConfig from '@konker.dev/common-config/configs/eslint.config-base.mjs';

export default [
  ...baseConfig,
  {
    ignores: [
      'dist/',
      'coverage/',
      'vitest.config.ts',
      'tsup.config.ts',
      '.deploy',
      '**/.sst/',
      '**/sst.config.ts',
      'sst-env.d.ts',
      'src/env.d.ts',
    ],
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
    files: ['**/*'],
    rules: {
      'fp/no-unused-expression': 'off',
      'fp/no-nil': 'off',
      'fp/no-let': 'off',
      'fp/no-mutation': 'off',
      'fp/no-mutating-methods': 'off',
      'fp/no-throw': 'off',
      'fp/no-class': 'off',
    },
  },
];
