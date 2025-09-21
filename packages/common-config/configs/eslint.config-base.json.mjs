import jsoncPlugin from 'eslint-plugin-jsonc';

export default [
  ...jsoncPlugin.configs['flat/recommended-with-json5'],
  { files: ['**/*.json5'] },
];
