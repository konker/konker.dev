import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      'lucide-solid': fileURLToPath(
        new URL('./node_modules/lucide-solid/dist/esm/lucide-solid.js', import.meta.url)
      ),
    },
  },
  test: {
    environment: 'jsdom',
  },
});
