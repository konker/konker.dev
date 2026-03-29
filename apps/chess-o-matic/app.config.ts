import { defineConfig } from '@solidjs/start/config';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
  ssr: false,
  serialization: {
    mode: 'json',
  },
  server: {
    prerender: {
      routes: ['/'],
    },
  },
  vite: {
    resolve: {
      alias: {
        'lucide-solid': resolve(import.meta.dirname, 'node_modules/lucide-solid/dist/esm/lucide-solid.js'),
      },
    },
    plugins: [tailwindcss()],
  },
});
