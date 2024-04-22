export const TAG_COLLECTIONS = ['til', 'projects'] as const;
export type TagCollection = (typeof TAG_COLLECTIONS)[number];

export const BLOG_COLLECTIONS = ['til'] as const;
export type BlogCollection = (typeof BLOG_COLLECTIONS)[number];
