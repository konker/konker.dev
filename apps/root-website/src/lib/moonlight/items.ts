import { getCollection } from 'astro:content';
import assert from 'node:assert';

import { isEntryDraftFilterPredicate, notEntryDraftFilterPredicate } from '../collections/helpers';
import type { MoonlightCollection } from './config';
import { toMoonlightItem } from './index';
import type { MoonlightItem } from './types';
import { countSlugPathParts } from './utils';

// --------------------------------------------------------------------------
export function isItemIndexFilterPredicate<T extends MoonlightCollection>(moonlightItem: MoonlightItem<T>): boolean {
  return countSlugPathParts(moonlightItem.entry.slug) === 1;
}

export function isItemDraftFilterPredicate<T extends MoonlightCollection>(item: MoonlightItem<T>) {
  return isEntryDraftFilterPredicate(item.entry);
}

export function notItemDraftFilterPredicate<T extends MoonlightCollection>(item: MoonlightItem<T>) {
  return notEntryDraftFilterPredicate(item.entry);
}

// --------------------------------------------------------------------------
export function moonlightPruneDraftSubCollections<T extends MoonlightCollection>(
  allItems: Array<MoonlightItem<T>>
): Array<MoonlightItem<T>> {
  // Find all the index items, for each sub-collection
  const indexItems = moonlightGetAllIndexItems(allItems);

  // If an index item is a draft, also prune all items from that sub-collection
  return indexItems.reduce((acc, indexItem) => {
    if (isItemDraftFilterPredicate(indexItem)) {
      // Filter out all items from this sub-collection
      return acc.filter((x) => x.subCollectionName !== indexItem.subCollectionName);
    }
    return acc;
  }, allItems);
}

// --------------------------------------------------------------------------
export async function moonlightGetAllItems<T extends MoonlightCollection>(
  collectionName: T,
  collectionRootPagesPath: string
) {
  const allEntries = await getCollection(collectionName);
  const allItems = allEntries.map(toMoonlightItem(collectionName, collectionRootPagesPath));
  const prunedItems = moonlightPruneDraftSubCollections(allItems);

  return prunedItems
    .filter(notItemDraftFilterPredicate)
    .toSorted((a, b) => a.entry.slug.localeCompare(b.entry.slug))
    .toSorted((a, b) => a.order - b.order);
}

// --------------------------------------------------------------------------
export function moonlightGetAllIndexItems<T extends MoonlightCollection>(
  allItems: Array<MoonlightItem<T>>
): Array<MoonlightItem<T>> {
  return allItems
    .filter(isItemIndexFilterPredicate)
    .toSorted((a, b) => a.entry.slug.localeCompare(b.entry.slug))
    .toSorted((a, b) => a.indexOrder - b.indexOrder);
}

export function moonlightGetIndexItem<T extends MoonlightCollection>(
  subCollectionItems: Array<MoonlightItem<T>>
): MoonlightItem<T> {
  const ret = subCollectionItems
    .filter(isItemIndexFilterPredicate)
    .toSorted((a, b) => a.entry.slug.localeCompare(b.entry.slug))
    .toSorted((a, b) => a.indexOrder - b.indexOrder)
    .pop();

  assert(ret !== undefined);

  return ret;
}

// --------------------------------------------------------------------------
export function moonlightGetSubCollectionItems<T extends MoonlightCollection>(
  allItems: Array<MoonlightItem<T>>,
  subCollectionName: string
): Array<MoonlightItem<T>> {
  return allItems.filter((x) => x.subCollectionName === subCollectionName);
}

// --------------------------------------------------------------------------
export function moonlightGetPrevItem<T extends MoonlightCollection>(
  allSubCollectionItems: Array<MoonlightItem<T>>,
  moonlightItem: MoonlightItem<T>
): MoonlightItem<T> | undefined {
  const subCollectionItemIndex = allSubCollectionItems.findIndex((x) => x.entry.slug === moonlightItem.entry.slug);
  const ret = subCollectionItemIndex > 0 ? allSubCollectionItems[subCollectionItemIndex - 1] : undefined;
  if (!ret || ret.entry.data.navigable) {
    return ret;
  }

  // Attempt to skip an item, if the prev item is not navigable
  return subCollectionItemIndex > 1 ? allSubCollectionItems[subCollectionItemIndex - 2] : undefined;
}

export function moonlightGetNextItem<T extends MoonlightCollection>(
  allSubCollectionItems: Array<MoonlightItem<T>>,
  moonlightItem: MoonlightItem<T>
): MoonlightItem<T> | undefined {
  const subCollectionItemIndex = allSubCollectionItems.findIndex((x) => x.entry.slug === moonlightItem.entry.slug);
  const ret =
    subCollectionItemIndex < allSubCollectionItems.length - 1
      ? allSubCollectionItems[subCollectionItemIndex + 1]
      : undefined;
  if (!ret || ret.entry.data.navigable) {
    return ret;
  }

  // Attempt to skip an item, if the next item is not navigable
  return subCollectionItemIndex < allSubCollectionItems.length - 2
    ? allSubCollectionItems[subCollectionItemIndex + 2]
    : undefined;
}
