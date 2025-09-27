import { resolve } from 'node:path';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import shield from '@kindspells/astro-shield';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const rootDir = new URL('.', import.meta.url).pathname;
const modulePath = resolve(rootDir, 'src', 'generated', 'sriHashes.mjs');

// FIXME: this does not work with CI, assumes git repo?
// import { remarkModifiedTime } from './src/lib/remark/remark-modified-time.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://konker.dev',

  integrations: [
    sitemap(),
    mdx(),
    shield({
      sri: {
        hashesModule: modulePath,
      },
    }),
  ],

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

  vite: {
    plugins: [tailwindcss()],
  },
});
