import { baseConfig } from '@konker.dev/common-config/configs/vitest.config-base';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      ...baseConfig.test.coverage,
      thresholds: {
        99: true,
      },
    },
  },
});
