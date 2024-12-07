import type { ViteUserConfig } from 'vitest/config';

export const baseConfig = {
  test: {
    coverage: {
      thresholds: {
        100: true,
      },
      provider: 'istanbul', // or 'v8'
    },
  },
} as const satisfies ViteUserConfig;
