import type { CollectionEntry } from 'astro:content';
import { TAG_COLLECTIONS, type TagCollection } from '../collections';

export const MOONLIGHT_COLLECTION_NAMES = ['projects'] as const;
export type MoonlightCollectionName = (typeof MOONLIGHT_COLLECTION_NAMES)[number];

export type MoonlightConfig = {
  readonly [key in MoonlightCollectionName]?: `/${string}`;
};

export const MOONLIGHT_CONFIG: MoonlightConfig = {
  projects: '/projects',
} as const;

export function isMoonlightCollection(x: unknown): x is TagCollection {
  return TAG_COLLECTIONS.includes(x as any);
}

export function isProjectEntry(x: unknown): x is CollectionEntry<MoonlightCollectionName> {
  return !!x && typeof x === 'object' && 'collection' in x && isMoonlightCollection(x.collection);
}
