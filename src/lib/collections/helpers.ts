/* eslint-disable @typescript-eslint/ban-ts-comment,fp/no-nil */
import type { CollectionEntry } from 'astro:content';

import type { Collections } from '../../content/config.ts';
import type { BreadcrumbT, SectionNavigationT } from '../types.ts';

export function collectionEntryToUrl<T extends Collections>(collection: T, entry: CollectionEntry<T>): string {
  return `/${collection}/${entry.slug}`;
}

export function collectionEntryToBreadcrumb<T extends Collections>(
  collection: T,
  entry: CollectionEntry<T> | undefined
): BreadcrumbT | undefined {
  return entry
    ? {
        url: collectionEntryToUrl(collection, entry),
        title: entry.data.title,
      }
    : undefined;
}

export function collectionEntryToSectionNavigation<T extends Collections>(
  collection: T,
  indexBreadcrumb: BreadcrumbT,
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
