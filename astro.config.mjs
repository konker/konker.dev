import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://konker.dev',
  integrations: [tailwind({})],
  outDir: 'www',
  server: { port: 4321, host: true },
  image: {
    domains: [],
  },
  markdown: {
    remarkPlugins: [
      /*remarkSectionize*/
    ],
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
  moonlight: {
    projects: '/projects',
  },
});
