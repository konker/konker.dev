import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

// FIXME: this does not work with CI, assumes git repo?
// import { remarkModifiedTime } from './src/lib/remark/remark-modified-time.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://konker.dev',
  integrations: [tailwind({}), sitemap(), mdx()],
  outDir: 'www',
  server: {
    port: 4321,
    host: true,
  },
  image: {
    domains: [],
  },
  markdown: {
    remarkPlugins: [],
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
});
