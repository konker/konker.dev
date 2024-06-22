import { getCollection } from 'astro:content';

import { notDraftFilterPredicate } from '../collections/helpers.ts';
import type { MoonlightCollection } from './config.ts';
import { type MoonlightItem, toMoonlightItem } from './index.ts';
import { countSlugPathParts } from './utils.ts';

// --------------------------------------------------------------------------
export function indexItemFilterPredicate<T extends MoonlightCollection>(moonlightItem: MoonlightItem<T>): boolean {
  return notDraftFilterPredicate(moonlightItem.entry) && countSlugPathParts(moonlightItem.entry.slug) === 1;
}

// --------------------------------------------------------------------------
export async function moonlightGetAllItems<T extends MoonlightCollection>(
  collectionName: T,
  collectionRootPagesPath: string
) {
  const allEntries = await getCollection(collectionName);
  return allEntries
    .filter(notDraftFilterPredicate)
    .map(toMoonlightItem(collectionName, collectionRootPagesPath))
    .toSorted((a, b) => a.entry.slug.localeCompare(b.entry.slug))
    .toSorted((a, b) => b.entry.data.order - a.entry.data.order);
}

// --------------------------------------------------------------------------
export function moonlightGetIndexItems<T extends MoonlightCollection>(
  allEntries: Array<MoonlightItem<T>>
): Array<MoonlightItem<T>> {
  return allEntries.filter(indexItemFilterPredicate);
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
