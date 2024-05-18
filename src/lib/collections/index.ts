import type { CollectionEntry } from 'astro:content';

export const TAG_COLLECTIONS = ['til', 'projects'] as const;
export type TagCollection = (typeof TAG_COLLECTIONS)[number];

export const BLOG_COLLECTIONS = ['til'] as const;
export type BlogCollection = (typeof BLOG_COLLECTIONS)[number];

export function isBlogCollection(x: unknown): x is BlogCollection {
  return BLOG_COLLECTIONS.includes(x as any);
}

export function isTagCollection(x: unknown): x is TagCollection {
  return TAG_COLLECTIONS.includes(x as any);
}

export function isBlogEntry(x: unknown): x is CollectionEntry<BlogCollection> {
  return !!x && typeof x === 'object' && 'collection' in x && isBlogCollection(x.collection);
}

export function isTagEntry(x: unknown): x is CollectionEntry<TagCollection> {
  return !!x && typeof x === 'object' && 'collection' in x && isTagCollection(x.collection);
}
