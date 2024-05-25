import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

import { remarkModifiedTime } from './src/lib/remark/remark-modified-time.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://konker.dev',
  integrations: [tailwind({}), sitemap()],
  outDir: 'www',
  server: {
    port: 4321,
    host: true,
  },
  image: {
    domains: [],
  },
  markdown: {
    remarkPlugins: [remarkModifiedTime],
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
});
