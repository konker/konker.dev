/* eslint-disable fp/no-nil */
import type { CollectionEntry, CollectionKey } from 'astro:content';
import { Box, Fingerprint, Home, Lightbulb, Tag, Tags } from 'lucide-astro';

import type { LinkT, SectionNavigationT } from '../types';

// --------------------------------------------------------------------------
export function isEntryDraftFilterPredicate<T extends CollectionKey>(entry: CollectionEntry<T>): boolean {
  return !!entry.data?.draft;
}

export function notEntryDraftFilterPredicate<T extends CollectionKey>(entry: CollectionEntry<T>): boolean {
  return !isEntryDraftFilterPredicate(entry);
}

// --------------------------------------------------------------------------
export function collectionEntryToUrl<T extends CollectionKey>(collection: T, entry: CollectionEntry<T>): string {
  return `/${collection}/${entry.id}`;
}

export function collectionEntryToBreadcrumb<T extends CollectionKey>(
  collection: T,
  entry: CollectionEntry<T> | undefined
): LinkT | undefined {
  return entry
    ? {
        url: collectionEntryToUrl(collection, entry),
        title: entry.data.title,
      }
    : undefined;
}

export function collectionEntryToSectionNavigation<T extends CollectionKey>(
  collection: T,
  indexBreadcrumb: LinkT,
  entries: Array<CollectionEntry<T>>,
  entry: CollectionEntry<T> | undefined
): SectionNavigationT | undefined {
  if (!entry) {
    return undefined;
  }
  const entryIndex = entries.findIndex((e) => e.id === entry.id);
  const prevEntry = entryIndex > 0 ? entries[entryIndex - 1] : undefined;
  const nextEntry = entry !== -1 && entryIndex < entries.length - 1 ? entries[entryIndex + 1] : undefined;

  return {
    index: indexBreadcrumb,
    prev: collectionEntryToBreadcrumb(collection, prevEntry),
    next: collectionEntryToBreadcrumb(collection, nextEntry),
  };
}

export function itemIconLookup(itemIconName: string | undefined) {
  switch (itemIconName) {
    case 'home':
      return Home;
    case 'blog':
    case 'til':
      return Lightbulb;
    case 'project':
    case 'projects':
      return Box;
    case 'tag':
      return Tag;
    case 'tags':
      return Tags;
    case 'about':
      return Fingerprint;
    default:
      return undefined;
  }
}

export const ITEM_ICON_CLASS_SELECTED = 'text-white';
export const ITEM_ICON_CLASS_BLOG = 'text-kdd-blog';
export const ITEM_ICON_CLASS_PROJECT = 'text-kdd-project';
export const ITEM_ICON_CLASS_TAG = 'text-kdd-tag';
export const ITEM_ICON_CLASS_DEFAULT = 'text-kdd';

export function itemTextClassLookup(itemIconName: string | undefined, selected = false) {
  if (selected) {
    return ITEM_ICON_CLASS_SELECTED;
  }

  switch (itemIconName) {
    case 'blog':
    case 'til':
      return ITEM_ICON_CLASS_BLOG;
    case 'project':
    case 'projects':
      return ITEM_ICON_CLASS_PROJECT;
    case 'tag':
    case 'tags':
      return ITEM_ICON_CLASS_TAG;
    default:
      return ITEM_ICON_CLASS_DEFAULT;
  }
}
