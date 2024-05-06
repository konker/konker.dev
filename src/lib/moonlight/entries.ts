import { type CollectionEntry, getCollection } from 'astro:content';

import type { MoonlightCollectionName } from './config.ts';
import { countSlugPathParts, extractProject } from './utils.ts';

export type MoonlightEntry<T extends CollectionEntry<MoonlightCollectionName>> = {
  readonly collectionRootPagesPath: string;
  readonly project: string;
  readonly entry: T;
};

export const toMoonlightEntry =
  (collectionRootPagesPath: string) =>
  <T extends CollectionEntry<MoonlightCollectionName>>(entry: T): MoonlightEntry<T> => ({
    collectionRootPagesPath,
    project: extractProject(entry.slug),
    entry: {
      ...entry,
      slug: `${collectionRootPagesPath}/${entry.slug}`,
    },
  });

export function getStaticPathsFilterPredicate(entry: CollectionEntry<MoonlightCollectionName>): boolean {
  return !entry.data?.draft;
}

export function indexEntriesFilterPredicate<T extends CollectionEntry<MoonlightCollectionName>>(
  moonlightEntry: MoonlightEntry<T>
): boolean {
  return getStaticPathsFilterPredicate(moonlightEntry.entry) && countSlugPathParts(moonlightEntry.entry.slug) === 2;
}

export async function moonlightGetAllEntries(collectionName: MoonlightCollectionName, collectionRootPagesPath: string) {
  const allEntries = await getCollection(collectionName);

  const moonlightEntries = allEntries
    .filter(getStaticPathsFilterPredicate)
    .map(toMoonlightEntry(collectionRootPagesPath));

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

export function moonlightGetIndexEntries<T extends CollectionEntry<MoonlightCollectionName>>(
  allEntries: Array<MoonlightEntry<T>>
): Array<T> {
  return allEntries.filter(indexEntriesFilterPredicate).map((x) => x.entry);
}

export function moonlightGetProjectAndRootEntries<T extends CollectionEntry<MoonlightCollectionName>>(
  allEntries: Array<MoonlightEntry<T>>,
  project: string
) {
  return allEntries.filter((x) => x.project === project);
}

export function moonlightGetProjectEntries<T extends CollectionEntry<MoonlightCollectionName>>(
  allEntries: Array<MoonlightEntry<T>>,
  project: string
) {
  return moonlightGetProjectAndRootEntries(allEntries, project)
    .filter((x) => !indexEntriesFilterPredicate(x))
    .map((x) => x.entry);
}

export function moonlightGetProjectRootEntry<T extends CollectionEntry<MoonlightCollectionName>>(
  allEntries: Array<MoonlightEntry<T>>,
  project: string
) {
  const projectRoot = allEntries.find((x) => x.project === project && indexEntriesFilterPredicate(x));
  return projectRoot?.entry;
}

export function moonlightGetPrevEntry<T extends CollectionEntry<MoonlightCollectionName>>(
  allEntries: Array<MoonlightEntry<T>>,
  moonlightEntry: MoonlightEntry<T>
) {
  const projectEntries = moonlightGetProjectAndRootEntries(allEntries, moonlightEntry.project);
  const projectEntryIndex = projectEntries.findIndex((x) => x.entry.slug === moonlightEntry.entry.slug);
  return projectEntryIndex > 0 ? projectEntries[projectEntryIndex - 1] : undefined;
}

export function moonlightGetNextEntry<T extends CollectionEntry<MoonlightCollectionName>>(
  allEntries: Array<MoonlightEntry<T>>,
  moonlightEntry: MoonlightEntry<T>
) {
  const projectEntries = moonlightGetProjectAndRootEntries(allEntries, moonlightEntry.project);
  const projectEntryIndex = projectEntries.findIndex((x) => x.entry.slug === moonlightEntry.entry.slug);
  return projectEntryIndex < allEntries.length - 1 ? projectEntries[projectEntryIndex + 1] : undefined;
}
