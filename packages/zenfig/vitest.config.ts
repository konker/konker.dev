import { baseConfig } from '@konker.dev/common-config/configs/vitest.config-base';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    coverage: {
      ...baseConfig.test.coverage,
      thresholds: {
        lines: 97,
        functions: 97,
        statements: 97,
        branches: 97,
      },
    },
  },
});
