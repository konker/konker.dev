import { z } from 'astro/zod';

export const MoonlightSchema = z.object({
  /** The title of the current page. Required. */
  title: z.string(),

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
