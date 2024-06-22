import { z } from 'astro/zod';

import { MOONLIGHT_ENTRY_KIND_REFERENCE, MOONLIGHT_ENTRY_KIND_REGULAR } from './index.ts';

export const MoonlightSchema = z.object({
  /** The title of the current page. Required. */
  title: z.string(),

  /** The kind of non-index page. Optional, default: `regular`. */
  kind: z
    .enum([MOONLIGHT_ENTRY_KIND_REGULAR, MOONLIGHT_ENTRY_KIND_REFERENCE])
    .optional()
    .default(MOONLIGHT_ENTRY_KIND_REGULAR),

  /**
   * An ordering property, for where the page appears in the sub-collection navigation.
   * The lower the value, the higher up in the order the item will appear, defaults to 1.
   */
  order: z.number().default(1),

  /**
   * An ordering property, for where the sub-collection appears in the index.
   * The lower the value, the higher up in the order the item will appear, defaults to MAX_SAFE_INTEGER.
   */
  indexOrder: z.number().default(Number.MAX_SAFE_INTEGER),

  /**
   * Whether the page should be navigated to,
   * or whether it is a logical placeholder for navigation display.
   */
  navigable: z.boolean().optional().default(true),

  /**
   * A short description of the current page’s content. Optional, but recommended.
   * A good description is 150–160 characters long and outlines the key content
   * of the page in a clear and engaging way.
   */
  description: z.string(),

  /**
   * Arbitrary tags that are associated with the piece of content
   */
  tags: z.array(z.string()).default([]),

  /**
   * True if the piece of content is a draft and should be filtered out from publication
   */
  draft: z.boolean().default(false),

  /**
   * The date the piece of content was originally published.
   */
  publishedDate: z.date().optional(),

  /**
   * The date the piece of content was last updated.
   */
  updatedDate: z.date().optional(),
});
