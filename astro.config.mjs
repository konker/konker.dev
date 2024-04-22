import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
// import remarkSectionize from 'remark-sectionize';

// https://astro.build/config
export default defineConfig({
  site: 'https://konker.dev',
  integrations: [tailwind({})],
  outDir: 'www',
  server: { port: 4321, host: true },
  markdown: {
    remarkPlugins: [
      /*remarkSectionize*/
    ],
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
  moonlight: {
    projects: '/projects',
  },
});
