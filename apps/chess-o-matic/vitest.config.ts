import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [solid()],
  test: {
    exclude: ['dist/', '.output/', '.vinxi/', 'node_modules/**'],
    environment: 'jsdom',
    coverage: {
      thresholds: {
        100: true,
      },
      provider: 'istanbul',
      exclude: ['dist/', '.output/', '.vinxi/', 'src/entry-client.tsx', 'src/entry-server.tsx'],
    },
  },
});
