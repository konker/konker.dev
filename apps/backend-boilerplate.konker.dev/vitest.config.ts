import { baseConfig } from '@konker.dev/common-config/configs/vitest.config-base';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    coverage: {
      ...baseConfig.test.coverage,
      exclude: [
        ...coverageConfigDefaults.exclude,
        'sst.config.ts',
        'src/hono/hono-app.ts',
        'src/hono/hono-aws-serverless.ts',
        'src/hono/hono-cloudflare-serverless.ts',
        'src/hono/hono-node-server.ts',
      ],
    },
  },
});
