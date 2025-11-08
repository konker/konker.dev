import baseConfig from '@konker.dev/common-config/configs/eslint.config-base.mjs';

export default [
  ...baseConfig,
  { ignores: ['dist/', 'coverage/', 'vitest.config.ts', '.sst/', 'sst.config.ts', 'sst-env.d.ts'] },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
