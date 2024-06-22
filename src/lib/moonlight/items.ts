import { getCollection } from 'astro:content';

import { isItemDraftFilterPredicate, notItemDraftFilterPredicate } from '../collections/helpers.ts';
import type { MoonlightCollection } from './config.ts';
import { type MoonlightItem, toMoonlightItem } from './index.ts';
import { countSlugPathParts } from './utils.ts';

// --------------------------------------------------------------------------
export function indexItemFilterPredicate<T extends MoonlightCollection>(moonlightItem: MoonlightItem<T>): boolean {
  return countSlugPathParts(moonlightItem.entry.slug) === 1;
}

// --------------------------------------------------------------------------
export function moonlightPruneDraftSubCollections<T extends MoonlightCollection>(
  allItems: Array<MoonlightItem<T>>
): Array<MoonlightItem<T>> {
  // Find all the index items, for each sub-collection
  const indexItems = moonlightGetIndexItems(allItems);

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
export function moonlightGetIndexItems<T extends MoonlightCollection>(
  allItems: Array<MoonlightItem<T>>
): Array<MoonlightItem<T>> {
  return allItems
    .filter(indexItemFilterPredicate)
    .toSorted((a, b) => a.entry.slug.localeCompare(b.entry.slug))
    .toSorted((a, b) => a.indexOrder - b.indexOrder);
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
