// Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';

import { MoonlightSchema } from '../lib/moonlight/schema.ts';

const tilCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    author: z.string(),
    draft: z.boolean().default(false),
    image: z.optional(
      z.object({
        url: z.string(),
        alt: z.string(),
      })
    ),
    tags: z.array(z.string()),
  }),
});

const projectsCollection = defineCollection({
  type: 'content',
  schema: MoonlightSchema,
});

export const collections = {
  til: tilCollection,
  projects: projectsCollection,
} as const;
