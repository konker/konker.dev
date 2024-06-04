import type { MarkdownHeading, MarkdownInstance } from 'astro';
import type { CollectionEntry } from 'astro:content';

import type { MoonlightCollection } from './config.ts';
import type { DepthGroupT } from './navigation.ts';
import { countSlugPathParts, extractProject } from './utils.ts';

// --------------------------------------------------------------------------
export const MOONLIGHT_PAGE_TYPE_INDEX = 'index' as const;
export type MoonlightPageTypeIndex = typeof MOONLIGHT_PAGE_TYPE_INDEX;

export const MOONLIGHT_PAGE_TYPE_ENTRY = 'entry' as const;
export type MoonlightPageTypeEntry = typeof MOONLIGHT_PAGE_TYPE_ENTRY;

// --------------------------------------------------------------------------
export const MOONLIGHT_ENTRY_KIND_REGULAR = 'regular' as const;
export type MoonlightEntryKindRegular = typeof MOONLIGHT_ENTRY_KIND_REGULAR;

export const MOONLIGHT_ENTRY_KIND_REFERENCE = 'reference' as const;
export type MoonlightEntryKindReference = typeof MOONLIGHT_ENTRY_KIND_REFERENCE;

export type MoonlightEntryKind = MoonlightEntryKindRegular | MoonlightEntryKindReference;

// --------------------------------------------------------------------------
export type MoonlightItem<T extends CollectionEntry<MoonlightCollection>> = {
  readonly collectionRootPagesPath: string;
  readonly project: string;
  readonly depth: number;
  readonly entry: T;
};

export const toMoonlightItem =
  (collectionRootPagesPath: string) =>
  <T extends CollectionEntry<MoonlightCollection>>(entry: T): MoonlightItem<T> => ({
    collectionRootPagesPath,
    project: extractProject(entry.slug),
    depth: countSlugPathParts(entry.slug),
    entry: {
      ...entry,
      slug: `${entry.slug}`,
    },
  });

// --------------------------------------------------------------------------
export type MoonlightProjectNavigationItem = MoonlightItem<CollectionEntry<MoonlightCollection>>;

/*
export type MoonlightProjectNavigationItem = {
  readonly title: string;
  readonly slug: string;
  readonly depth: number;
  // readonly entry: CollectionEntry<MoonlightCollection>;
};
*/

// --------------------------------------------------------------------------
export type MoonlightPagePropsIndex = {
  readonly type: MoonlightPageTypeIndex;
  readonly indexItems: Array<MoonlightProjectNavigationItem>;
  // readonly pageTitle: string;
};

// --------------------------------------------------------------------------
export type MoonlightPagePropsEntry = {
  readonly type: MoonlightPageTypeEntry;
  readonly kind: MoonlightEntryKind;

  // readonly projectRootEntry: CollectionEntry<MoonlightCollection>;
  // readonly projectEntries: Array<CollectionEntry<MoonlightCollection>>;

  readonly item: MoonlightItem<CollectionEntry<MoonlightCollection>>;
  readonly Content: MarkdownInstance<object>['Content']; // AstroComponentFactory;
  readonly headings: Array<MarkdownHeading>;
  readonly headingGroups: DepthGroupT<MarkdownHeading>;

  readonly projectNavigation: DepthGroupT<MoonlightProjectNavigationItem>;
  readonly prevItem: MoonlightProjectNavigationItem | undefined;
  readonly nextItem: MoonlightProjectNavigationItem | undefined;
};
