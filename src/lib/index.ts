/* eslint-disable @typescript-eslint/ban-ts-comment,fp/no-nil */
import type { CollectionEntry } from 'astro:content';
import * as D from 'date-fns';

import type { Breadcrumb, Collections, SectionNavigation } from './types.ts';

export const HomeBreadcrumb: Breadcrumb = {
  url: '/',
  title: 'Home',
};

export function toDisplayDate(date: Date): string {
  return D.formatDate(date, 'yyyy-MM-dd');
}

export function toReadableDate(date: Date): string {
  return D.formatDate(date, 'EEEE do MMMM yyyy');
}

export function collectionEntryToUrl<T extends Collections>(collection: T, entry: CollectionEntry<T>): string {
  return `/${collection}/${entry.slug}`;
}

export function collectionEntryToBreadcrumb<T extends Collections>(
  collection: T,
  entry: CollectionEntry<T> | undefined
): Breadcrumb | undefined {
  return entry
    ? {
        url: collectionEntryToUrl(collection, entry),
        title: entry.data.title,
      }
    : undefined;
}

export function collectionEntryToSectionNavigation<T extends Collections>(
  collection: T,
  indexBreadcrumb: Breadcrumb,
  entries: Array<CollectionEntry<T>>,
  entry: CollectionEntry<T> | undefined
): SectionNavigation | undefined {
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
