import { baseConfig } from '@konker.dev/common-config/configs/vitest.config-base';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    coverage: {
      ...baseConfig.test.coverage,

      // FIXME: complete tests for this
      exclude: [...baseConfig.test.coverage.exclude, 'src/stream/ChildProcessStreamPipe.ts'],
    },
  },
});
