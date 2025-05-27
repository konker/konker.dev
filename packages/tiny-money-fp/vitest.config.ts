import { baseConfig } from '@konker.dev/common-config/configs/vitest.config-base';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    coverage: {
      ...baseConfig.test.coverage,

      // FIXME: complete tests for this
      exclude: [
        'src/scripts/generate-currency-defs/index.ts',
        'src/scripts/generate-currency-defs/data',
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
