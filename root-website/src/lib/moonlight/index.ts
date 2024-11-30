import type { CollectionEntry } from 'astro:content';

import type { MoonlightCollection } from './config';
import type { MoonlightItem } from './types';
import { countSlugPathParts, extractSubCollectionName } from './utils';

export function moonlightItemDepth<T extends CollectionEntry<MoonlightCollection>>(entry: T): number {
  return Math.max(1, countSlugPathParts(entry.slug));
}

export const toMoonlightItem =
  <T extends MoonlightCollection>(collectionName: T, collectionRootPagesPath: string) =>
  <E extends CollectionEntry<T>>(entry: E): MoonlightItem<T> => ({
    collectionName,
    collectionRootPagesPath,
    subCollectionName: extractSubCollectionName(entry.slug),
    depth: moonlightItemDepth(entry),
    path: entry.slug,
    order: entry.data.order,
    indexOrder: entry.data.indexOrder,
    entry: {
      ...entry,
      slug: `${entry.slug}`,
    },
  });
