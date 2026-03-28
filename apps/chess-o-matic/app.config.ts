import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from '@solidjs/start/config';

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
