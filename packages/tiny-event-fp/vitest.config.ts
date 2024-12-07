import { coverageConfigDefaults, defineConfig } from 'vitest/config';
import { baseConfig } from '../common-config/vitest.config-base';

export default defineConfig({
  ...baseConfig,
  test: {
    coverage: {
      ...baseConfig.test.coverage,
      exclude: ['src/example.ts', ...coverageConfigDefaults.exclude],
    },
  },
});
