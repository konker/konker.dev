import { type CollectionEntry } from 'astro:content';

import type { MoonlightCollectionName, MoonlightConfig } from './config.ts';
import {
  type MoonlightEntry,
  moonlightGetAllEntries,
  moonlightGetIndexEntries,
  moonlightGetNextEntry,
  moonlightGetPrevEntry,
  moonlightGetProjectEntries,
  moonlightGetProjectRootEntry,
} from './entries.ts';
import { MOONLIGHT_PAGE_TYPE_ENTRY, MOONLIGHT_PAGE_TYPE_INDEX } from './index.ts';
import { RecordKeysOf } from './utils.ts';

export const formatRootIndexStaticPath = <T extends CollectionEntry<MoonlightCollectionName>>(
  allEntries: Array<MoonlightEntry<T>>,
  collectionRootPagesPath: string
) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  params: { moonlight_slug: collectionRootPagesPath },
  props: {
    type: MOONLIGHT_PAGE_TYPE_INDEX,
    indexEntries: moonlightGetIndexEntries(allEntries),
  },
});

export const formatEntryStaticPath =
  <T extends CollectionEntry<MoonlightCollectionName>>(allEntries: Array<MoonlightEntry<T>>) =>
  async (moonlightEntry: MoonlightEntry<T>) => {
    const { Content, headings } = await moonlightEntry.entry.render();
    const prevEntry = moonlightGetPrevEntry(allEntries, moonlightEntry);
    const nextEntry = moonlightGetNextEntry(allEntries, moonlightEntry);
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      params: { moonlight_slug: moonlightEntry.entry.slug },
      props: {
        type: MOONLIGHT_PAGE_TYPE_ENTRY,
        projectRootEntry: moonlightGetProjectRootEntry(allEntries, moonlightEntry.project),
        entry: moonlightEntry.entry,
        prevEntry: prevEntry?.entry,
        nextEntry: nextEntry?.entry,
        projectEntries: moonlightGetProjectEntries(allEntries, moonlightEntry.project),
        Content,
        headings,
      },
    };
  };

export async function moonlightGetStaticPaths(moonlightConfig: MoonlightConfig) {
  const ret = [];

  for (const collectionName of RecordKeysOf(moonlightConfig)) {
    const collectionRootPagesPath = moonlightConfig[collectionName]!;
    const allEntries = await moonlightGetAllEntries(collectionName, collectionRootPagesPath);
    const contentPaths = await Promise.all(allEntries.map(formatEntryStaticPath(allEntries)));
    const rootIndexPath = formatRootIndexStaticPath(allEntries, collectionRootPagesPath);

    ret.push([rootIndexPath, ...contentPaths]);
  }
  return ret.flat();
}
