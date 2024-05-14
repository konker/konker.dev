export const TAG_COLLECTIONS = ['til', 'projects'] as const;
export type TagCollection = (typeof TAG_COLLECTIONS)[number];

export const BLOG_COLLECTIONS = ['til'] as const;
export type BlogCollection = (typeof BLOG_COLLECTIONS)[number];

export function isBlogCollection(x: string): x is BlogCollection {
  return BLOG_COLLECTIONS.includes(x as any);
}

export function isTagCollection(x: string): x is TagCollection {
  return TAG_COLLECTIONS.includes(x as any);
}
