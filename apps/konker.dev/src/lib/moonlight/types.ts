import type { MarkdownHeading, MarkdownInstance } from 'astro';
import type { CollectionEntry } from 'astro:content';

import type { MoonlightCollection } from './config';

// --------------------------------------------------------------------------
export type HasDepthT = { readonly depth: number };
export type DepthGroupT<T extends HasDepthT> = Array<T | DepthGroupT<T>>;

export type HasPathT = HasDepthT & { readonly path: string };
export type HasTextT = HasDepthT & { readonly text: string };

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
  readonly subCollectionName: string;
  readonly depth: number;
  readonly path: string;
  readonly order: number;
  readonly indexOrder: number;
  readonly entry: CollectionEntry<T>;
};

// --------------------------------------------------------------------------
export type MoonlightSubCollectionNavigationItem = MoonlightItem<MoonlightCollection>;

// --------------------------------------------------------------------------
export type MoonlightPagePropsIndex = {
  readonly type: MoonlightPageTypeIndex;
  readonly indexItems: Array<MoonlightSubCollectionNavigationItem>;
};

// --------------------------------------------------------------------------
export type MoonlightPagePropsEntry<T extends MoonlightCollection> = {
  readonly type: MoonlightPageTypeEntry;
  readonly kind: MoonlightEntryKind;

  readonly item: MoonlightItem<T>;
  readonly Content: MarkdownInstance<object>['Content']; // AstroComponentFactory;
  readonly headings: Array<MarkdownHeading>;
  readonly headingGroups: DepthGroupT<MarkdownHeading>;

  readonly subCollectionNavigation: DepthGroupT<MoonlightSubCollectionNavigationItem>;
  readonly breadcrumbNavigation: Array<MoonlightSubCollectionNavigationItem>;
  readonly prevItem: MoonlightSubCollectionNavigationItem | undefined;
  readonly nextItem: MoonlightSubCollectionNavigationItem | undefined;
};
