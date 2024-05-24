import { getCollection, type CollectionEntry } from 'astro:content';

import { notDraftFilterPredicate } from '../collections/helpers.ts';
import type { MoonlightCollection } from './config.ts';
import { countSlugPathParts, extractProject } from './utils.ts';

// --------------------------------------------------------------------------
export type MoonlightEntry<T extends CollectionEntry<MoonlightCollection>> = {
  readonly collectionRootPagesPath: string;
  readonly project: string;
  readonly entry: T;
};

export const toMoonlightEntry =
  (collectionRootPagesPath: string) =>
  <T extends CollectionEntry<MoonlightCollection>>(entry: T): MoonlightEntry<T> => ({
    collectionRootPagesPath,
    project: extractProject(entry.slug),
    entry: {
      ...entry,
      slug: `${entry.slug}`,
    },
  });

// --------------------------------------------------------------------------
export function indexEntriesFilterPredicate<T extends CollectionEntry<MoonlightCollection>>(
  moonlightEntry: MoonlightEntry<T>
): boolean {
  return notDraftFilterPredicate(moonlightEntry.entry) && countSlugPathParts(moonlightEntry.entry.slug) === 1;
}

// --------------------------------------------------------------------------
export async function moonlightGetAllEntries(collectionName: MoonlightCollection, collectionRootPagesPath: string) {
  const allEntries = await getCollection(collectionName);

  const moonlightEntries = allEntries.filter(notDraftFilterPredicate).map(toMoonlightEntry(collectionRootPagesPath));

  // Make sure the index entry is at the top
  return moonlightEntries.sort((a, b) => {
    if (indexEntriesFilterPredicate(a)) {
      return -1;
    }
    if (indexEntriesFilterPredicate(b)) {
      return 1;
    }
    return 0;
  });
}

export function moonlightGetIndexEntries<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightEntry<T>>
): Array<T> {
  return allEntries.filter(indexEntriesFilterPredicate).map((x) => x.entry);
}

export function moonlightGetProjectAndRootEntries<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightEntry<T>>,
  project: string
) {
  return allEntries.filter((x) => x.project === project);
}

export function moonlightGetProjectEntries<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightEntry<T>>,
  project: string
) {
  return moonlightGetProjectAndRootEntries(allEntries, project)
    .filter((x) => !indexEntriesFilterPredicate(x))
    .map((x) => x.entry);
}

export function moonlightGetProjectRootEntry<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightEntry<T>>,
  project: string
) {
  const projectRoot = allEntries.find((x) => x.project === project && indexEntriesFilterPredicate(x));
  return projectRoot?.entry;
}

export function moonlightGetPrevEntry<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightEntry<T>>,
  moonlightEntry: MoonlightEntry<T>
) {
  const projectEntries = moonlightGetProjectAndRootEntries(allEntries, moonlightEntry.project);
  const projectEntryIndex = projectEntries.findIndex((x) => x.entry.slug === moonlightEntry.entry.slug);
  return projectEntryIndex > 0 ? projectEntries[projectEntryIndex - 1] : undefined;
}

export function moonlightGetNextEntry<T extends CollectionEntry<MoonlightCollection>>(
  allEntries: Array<MoonlightEntry<T>>,
  moonlightEntry: MoonlightEntry<T>
) {
  const projectEntries = moonlightGetProjectAndRootEntries(allEntries, moonlightEntry.project);
  const projectEntryIndex = projectEntries.findIndex((x) => x.entry.slug === moonlightEntry.entry.slug);
  return projectEntryIndex < allEntries.length - 1 ? projectEntries[projectEntryIndex + 1] : undefined;
}
