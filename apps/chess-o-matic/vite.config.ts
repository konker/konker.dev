import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    // HTTPS is required for microphone access in modern browsers
    basicSsl(),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './src/index.html',
      },
    },
  },
  optimizeDeps: {
    include: ['vosk-browser'],
  },
});