import { defineConfig } from 'vitest/config';

import { baseConfig } from './configs/vitest.config-base';

export default defineConfig({
  ...baseConfig,
  test: {
    coverage: {
      provider: 'istanbul', // or 'v8'
    },
  },
});
