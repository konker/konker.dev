import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: 'src',
  plugins: [
    // HTTPS is required for microphone access in modern browsers
    basicSsl(),
    viteStaticCopy({
      targets: [
        { src: 'grammar/*.json', dest: 'grammar' },
        { src: 'recognizer-model/*.zip', dest: 'recognizer-model' },
      ],
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