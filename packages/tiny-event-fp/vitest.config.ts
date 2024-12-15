import { baseConfig } from '@konker.dev/common-config/configs/vitest.config-base';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    coverage: {
      ...baseConfig.test.coverage,
      exclude: ['src/example.ts', ...coverageConfigDefaults.exclude],
    },
  },
});
