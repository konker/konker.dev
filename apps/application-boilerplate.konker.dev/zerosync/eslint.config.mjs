import baseConfig from '@konker.dev/common-config/configs/eslint.config-base.mjs';

export default [
  ...baseConfig,
  { ignores: ['dist/', 'coverage/'] },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
