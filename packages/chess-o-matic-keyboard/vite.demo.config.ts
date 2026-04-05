import solid from 'vite-plugin-solid';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [solid()],
  root: './demo',
  server: {
    host: '0.0.0.0',
    port: 4177,
  },
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true,
  },
});
