import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: 'src',
  plugins: [
    // HTTPS is required for microphone access in modern browsers
    basicSsl(),
    viteStaticCopy({
      targets: [],
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: '../dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['vosk-browser'],
  },
});
