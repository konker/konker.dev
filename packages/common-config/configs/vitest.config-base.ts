import { coverageConfigDefaults, defaultExclude, type ViteUserConfig } from 'vitest/config';

export const baseConfig = {
  test: {
    exclude: [...defaultExclude, 'dist/'],
    coverage: {
      thresholds: {
        100: true,
      },
      provider: 'istanbul', // or 'v8'
      exclude: [...coverageConfigDefaults.exclude, 'dist/'],
    },
  },
} as const satisfies ViteUserConfig;
