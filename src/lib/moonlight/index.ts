import type { MarkdownHeading, MarkdownInstance } from 'astro';
import type { CollectionEntry } from 'astro:content';

import type { MoonlightCollectionName } from './config.ts';

export const MOONLIGHT_PAGE_TYPE_INDEX = 'index' as const;
export type MoonlightPageTypeIndex = typeof MOONLIGHT_PAGE_TYPE_INDEX;

export const MOONLIGHT_PAGE_TYPE_ENTRY = 'entry' as const;
export type MoonlightPageTypeEntry = typeof MOONLIGHT_PAGE_TYPE_ENTRY;

export type MoonlightPagePropsIndex = {
  readonly type: MoonlightPageTypeIndex;
  readonly pageTitle: string;
  readonly indexEntries: Array<CollectionEntry<MoonlightCollectionName>>;
};

export type MoonlightPagePropsEntry = {
  readonly type: MoonlightPageTypeEntry;
  readonly projectRootEntry: CollectionEntry<MoonlightCollectionName>;
  readonly entry: CollectionEntry<MoonlightCollectionName>;
  readonly prevEntry: CollectionEntry<MoonlightCollectionName> | undefined;
  readonly nextEntry: CollectionEntry<MoonlightCollectionName> | undefined;
  readonly projectEntries: Array<CollectionEntry<MoonlightCollectionName>>;
  readonly Content: MarkdownInstance<object>['Content']; // AstroComponentFactory;
  readonly headings: Array<MarkdownHeading>;
};

export type MoonlightPageProps = MoonlightPagePropsIndex | MoonlightPagePropsEntry;
