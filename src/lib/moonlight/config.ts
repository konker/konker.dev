import type { CollectionEntry } from 'astro:content';

export const MOONLIGHT_COLLECTION_NAMES = ['projects'] as const;
export type MoonlightCollection = (typeof MOONLIGHT_COLLECTION_NAMES)[number];

export type MoonlightConfig = {
  readonly [key in MoonlightCollection]?: {
    readonly rootPathTitle: string;
  };
};

export const MOONLIGHT_NAVIGATION_TITLE_OVERVIEW = 'Overview';

export const MOONLIGHT_CONFIG: MoonlightConfig = {
  projects: {
    rootPathTitle: 'Projects',
  },
} as const;

export function isMoonlightCollection(x: unknown): x is MoonlightCollection {
  return MOONLIGHT_COLLECTION_NAMES.includes(x as any);
}

export function isMoonlightEntry(x: unknown): x is CollectionEntry<MoonlightCollection> {
  return !!x && typeof x === 'object' && 'collection' in x && isMoonlightCollection(x.collection);
}
