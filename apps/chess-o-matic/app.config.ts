import { defineConfig } from '@solidjs/start/config';
import tailwindcss from '@tailwindcss/vite';

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
    plugins: [tailwindcss()],
  },
});
