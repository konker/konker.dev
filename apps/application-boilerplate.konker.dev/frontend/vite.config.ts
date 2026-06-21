import solid from 'vite-plugin-solid';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 5273,
  },
});
