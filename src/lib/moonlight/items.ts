import { type CollectionEntry, getCollection } from 'astro:content';

import { notDraftFilterPredicate } from '../collections/helpers.ts';
import type { MoonlightCollection } from './config.ts';
import { type MoonlightItem, toMoonlightItem } from './index.ts';
import { countSlugPathParts } from './utils.ts';

// --------------------------------------------------------------------------
export function indexItemFilterPredicate<T extends CollectionEntry<MoonlightCollection>>(
  moonlightItem: MoonlightItem<T>
): boolean {
  return notDraftFilterPredicate(moonlightItem.entry) && countSlugPathParts(moonlightItem.entry.slug) === 1;
}

// --------------------------------------------------------------------------
export async function moonlightGetAllItems<T extends MoonlightCollection>(
  collectionName: T,
  collectionRootPagesPath: string
) {
  const allEntries = await getCollection(collectionName);
  return allEntries.filter(notDraftFilterPredicate).map(toMoonlightItem(collectionRootPagesPath));

  /*FIXME: move to explicit sort function
  // Make sure the index entry is at the top
  return moonlightItems.sort((a, b) => {
    if (indexItemFilterPredicate(a)) {
      return -1;
    }
    if (indexItemFilterPredicate(b)) {
      return 1;
    }
    return 0;
  });
   */
}

// --------------------------------------------------------------------------
export function moonlightGetIndexItems<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightItem<T>>
): Array<MoonlightItem<T>> {
  return allEntries.filter(indexItemFilterPredicate);
}

/*FIXME: remove?
export function moonlightGetProjectAndRootEntries<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightItem<T>>,
  project: string
) {
  return allEntries.filter((x) => x.project === project);
}

// --------------------------------------------------------------------------
export function moonlightGetProjectEntries<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightItem<T>>,
  project: string
) {
  return moonlightGetProjectAndRootEntries(allEntries, project)
    .filter((x) => !indexItemFilterPredicate(x))
    .map((x) => x.entry);
}
*/

// --------------------------------------------------------------------------
export function moonlightGetProjectItems<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightItem<T>>,
  project: string
): Array<MoonlightItem<T>> {
  return allEntries.filter((x) => x.project === project).filter((x) => !indexItemFilterPredicate(x));
}

// --------------------------------------------------------------------------
export function moonlightGetProjectRootEntry<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightItem<T>>,
  project: string
) {
  const projectRoot = allEntries.find((x) => x.project === project && indexItemFilterPredicate(x));
  return projectRoot?.entry;
}

// --------------------------------------------------------------------------
export function moonlightGetPrevItem<T extends CollectionEntry<MoonlightCollection>>(
  _allEntries: Array<MoonlightItem<T>>,
  moonlightItem: MoonlightItem<T>
): MoonlightItem<T> | undefined {
  return moonlightItem;
  /*FIXME
  const projectEntries = moonlightGetProjectAndRootEntries(allEntries, moonlightEntry.project);
  const projectEntryIndex = projectEntries.findIndex((x) => x.entry.slug === moonlightEntry.entry.slug);
  return projectEntryIndex > 0 ? projectEntries[projectEntryIndex - 1] : undefined;
  */
}

export function moonlightGetNextItem<T extends CollectionEntry<MoonlightCollection>>(
  _allEntries: Array<MoonlightItem<T>>,
  moonlightItem: MoonlightItem<T>
): MoonlightItem<T> | undefined {
  return moonlightItem;
  /*FIXME
  const projectEntries = moonlightGetProjectAndRootEntries(allEntries, moonlightItem.project);
  const projectEntryIndex = projectEntries.findIndex((x) => x.entry.slug === moonlightItem.entry.slug);
  return projectEntryIndex < allEntries.length - 1 ? projectEntries[projectEntryIndex + 1] : undefined;
  */
}
