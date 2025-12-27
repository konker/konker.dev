import { baseConfig } from '@konker.dev/common-config/configs/vitest.config-base';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    coverage: {
      ...baseConfig.test.coverage,
      exclude: [...baseConfig.test.coverage.exclude, 'src/test/utils.ts'],
    },
  },
});
