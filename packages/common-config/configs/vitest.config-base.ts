import { coverageConfigDefaults, type ViteUserConfig } from 'vitest/config';

export const baseConfig = {
  test: {
    exclude: ['dist/'],
    coverage: {
      thresholds: {
        100: true,
      },
      provider: 'istanbul', // or 'v8'
      exclude: ['dist/', ...coverageConfigDefaults.exclude],
    },
  },
} as const satisfies ViteUserConfig;
