/* eslint-disable @typescript-eslint/ban-ts-comment,fp/no-nil */
import type { CollectionEntry } from 'astro:content';
import { FileText, GitBranch, Lightbulb, Tag, Tags } from 'lucide-astro';

import type { CollectionName } from '../../content/config.ts';
import type { LinkT, SectionNavigationT } from '../types.ts';

export function collectionEntryToUrl<T extends CollectionName>(collection: T, entry: CollectionEntry<T>): string {
  return `/${collection}/${entry.slug}`;
}

export function collectionEntryToBreadcrumb<T extends CollectionName>(
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

export function collectionEntryToSectionNavigation<T extends CollectionName>(
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

export function itemIconLookup(itemIconName: string) {
  switch (itemIconName) {
    case 'blog':
    case 'til':
      return Lightbulb;
    case 'project':
    case 'projects':
      return GitBranch;
    case 'tag':
      return Tag;
    case 'tags':
      return Tags;
    default:
      return FileText;
  }
}
