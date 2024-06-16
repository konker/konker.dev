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
export type MoonlightItem<T extends MoonlightCollection> = {
  readonly collectionName: T;
  readonly collectionRootPagesPath: string;
  readonly project: string;
  readonly depth: number;
  readonly path: string;
  readonly order: number;
  readonly entry: CollectionEntry<T>;
};

export function moonlightItemDepth<T extends CollectionEntry<MoonlightCollection>>(entry: T): number {
  return Math.max(1, countSlugPathParts(entry.slug));
}

export const toMoonlightItem =
  <T extends MoonlightCollection>(collectionName: T, collectionRootPagesPath: string) =>
  <E extends CollectionEntry<T>>(entry: E): MoonlightItem<T> => ({
    collectionName,
    collectionRootPagesPath,
    project: extractProject(entry.slug),
    depth: moonlightItemDepth(entry),
    path: entry.slug,
    order: entry.data.order ?? 0,
    entry: {
      ...entry,
      slug: `${entry.slug}`,
    },
  });

// --------------------------------------------------------------------------
export type MoonlightProjectNavigationItem = MoonlightItem<MoonlightCollection>;

// --------------------------------------------------------------------------
export type MoonlightPagePropsIndex = {
  readonly type: MoonlightPageTypeIndex;
  readonly indexItems: Array<MoonlightProjectNavigationItem>;
};

// --------------------------------------------------------------------------
export type MoonlightPagePropsEntry<T extends MoonlightCollection> = {
  readonly type: MoonlightPageTypeEntry;
  readonly kind: MoonlightEntryKind;

  readonly item: MoonlightItem<T>;
  readonly Content: MarkdownInstance<object>['Content']; // AstroComponentFactory;
  readonly headings: Array<MarkdownHeading>;
  readonly headingGroups: DepthGroupT<MarkdownHeading>;

  readonly projectNavigation: DepthGroupT<MoonlightProjectNavigationItem>;
  readonly breadcrumbNavigation: Array<MoonlightProjectNavigationItem>;
  readonly prevItem: MoonlightProjectNavigationItem | undefined;
  readonly nextItem: MoonlightProjectNavigationItem | undefined;
};
