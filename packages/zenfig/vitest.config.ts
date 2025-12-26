import { baseConfig } from '@konker.dev/common-config/configs/vitest.config-base';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    coverage: {
      ...baseConfig.test.coverage,
      // Override thresholds for new package - to be increased as more tests are added
      thresholds: {
        lines: 20,
        functions: 15,
        statements: 20,
        branches: 20,
      },
    },
  },
});
