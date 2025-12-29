import { baseConfig } from '@konker.dev/common-config/configs/vitest.config-base';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    coverage: {
      ...baseConfig.test.coverage,
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 92,
      },
    },
  },
});
