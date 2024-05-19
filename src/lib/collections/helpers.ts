import type { CollectionEntry, ContentCollectionKey } from 'astro:content';
import { Box, Fingerprint, Home, Lightbulb, Tag, Tags } from 'lucide-astro';

import type { LinkT, SectionNavigationT } from '../types.ts';

// --------------------------------------------------------------------------
export function notDraftFilterPredicate<T extends ContentCollectionKey>(entry: CollectionEntry<T>): boolean {
  return !entry.data?.draft;
}

// --------------------------------------------------------------------------
export function collectionEntryToUrl<T extends ContentCollectionKey>(collection: T, entry: CollectionEntry<T>): string {
  return `/${collection}/${entry.slug}`;
}

export function collectionEntryToBreadcrumb<T extends ContentCollectionKey>(
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

export function collectionEntryToSectionNavigation<T extends ContentCollectionKey>(
  collection: T,
  indexBreadcrumb: LinkT,
  entries: Array<CollectionEntry<T>>,
  entry: CollectionEntry<T> | undefined
): SectionNavigationT | undefined {
  if (!entry) {
    return undefined;
  }
  const entryIndex = entries.findIndex((e) => e.slug === entry.slug);
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

export function itemTextClassLookup(itemIconName: string | undefined, selected = false) {
  if (selected) {
    return 'text-white';
  }

  switch (itemIconName) {
    case 'blog':
    case 'til':
      return 'text-kdd-blog';
    case 'project':
    case 'projects':
      return 'text-kdd-project';
    case 'tag':
    case 'tags':
      return 'text-kdd-tag';
    default:
      return 'text-kdd';
  }
}
