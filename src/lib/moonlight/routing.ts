import { type CollectionEntry } from 'astro:content';
import * as fs from 'node:fs';

import type { MoonlightCollection, MoonlightConfig } from './config.ts';
import {
  MOONLIGHT_ENTRY_KIND_REGULAR,
  MOONLIGHT_PAGE_TYPE_ENTRY,
  MOONLIGHT_PAGE_TYPE_INDEX,
  type MoonlightItem,
  type MoonlightPagePropsEntry,
  type MoonlightPagePropsIndex,
} from './index.ts';
import {
  moonlightGetAllItems,
  moonlightGetIndexItems,
  moonlightGetNextItem,
  moonlightGetPrevItem,
  moonlightGetProjectItems,
} from './items.ts';
import { groupItemsByDepth } from './navigation.ts';
import { RecordKeysOf } from './utils.ts';

// --------------------------------------------------------------------------
export type StaticPathIndex = {
  readonly params: {
    readonly moonlight_index_slug: string;
  };
  props: MoonlightPagePropsIndex;
};

export type StaticPathEntry = {
  readonly params: {
    readonly moonlight_slug: string;
  };
  props: MoonlightPagePropsEntry;
};

// --------------------------------------------------------------------------
export const formatStaticPathIndex = <T extends CollectionEntry<MoonlightCollection>>(
  allItems: Array<MoonlightItem<T>>,
  collectionRootPagePath: string
): StaticPathIndex => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  params: { moonlight_index_slug: collectionRootPagePath },
  props: {
    type: MOONLIGHT_PAGE_TYPE_INDEX,
    indexItems: moonlightGetIndexItems(allItems),
  },
});

// --------------------------------------------------------------------------
export const formatStaticPathEntry =
  <T extends CollectionEntry<MoonlightCollection>>(allItems: Array<MoonlightItem<T>>) =>
  async (moonlightItem: MoonlightItem<T>): Promise<StaticPathEntry> => {
    const { Content, headings } = await moonlightItem.entry.render();
    const allProjectItems = moonlightGetProjectItems(allItems, moonlightItem.project);
    const prevItem = moonlightGetPrevItem(allItems, moonlightItem);
    const nextItem = moonlightGetNextItem(allItems, moonlightItem);
    fs.writeFileSync('/tmp/KONK60.json', JSON.stringify(allProjectItems, null, 2));
    fs.writeFileSync('/tmp/KONK61.json', JSON.stringify(groupItemsByDepth(allProjectItems), null, 2));
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      params: { moonlight_slug: `${moonlightItem.collectionRootPagesPath}/${moonlightItem.entry.slug}` },
      props: {
        type: MOONLIGHT_PAGE_TYPE_ENTRY,
        kind: MOONLIGHT_ENTRY_KIND_REGULAR, // FIXME

        // projectRootEntry: moonlightGetProjectRootEntry(allItems, moonlightItem.project),
        // projectEntries: moonlightGetProjectEntries(allItems, moonlightItem.project),

        item: moonlightItem,
        Content,
        headings,
        headingGroups: groupItemsByDepth(headings),

        projectNavigation: groupItemsByDepth(allProjectItems),
        prevItem: prevItem,
        nextItem: nextItem,
      },
    };
  };

// --------------------------------------------------------------------------
export async function moonlightGetStaticPathsIndex(moonlightConfig: MoonlightConfig): Promise<Array<StaticPathIndex>> {
  const ret = [];

  for (const collectionName of RecordKeysOf(moonlightConfig)) {
    const collectionRootPagePath = moonlightConfig[collectionName]!;
    const allItems = await moonlightGetAllItems(collectionName, collectionRootPagePath);
    const rootIndexStaticPath = formatStaticPathIndex(allItems, collectionRootPagePath);

    ret.push(rootIndexStaticPath);
  }
  return ret;
}

// --------------------------------------------------------------------------
export async function moonlightGetStaticPathsEntries(
  moonlightConfig: MoonlightConfig
): Promise<Array<StaticPathEntry>> {
  const ret = [];

  for (const collectionName of RecordKeysOf(moonlightConfig)) {
    const collectionRootPagePath = moonlightConfig[collectionName]!;
    const allEntries = await moonlightGetAllItems(collectionName, collectionRootPagePath);
    const contentPaths = await Promise.all(allEntries.map(formatStaticPathEntry(allEntries)));

    ret.push(contentPaths);
  }
  return ret.flat();
}

/*FIXME: remove
// --------------------------------------------------------------------------
export async function moonlightGetStaticPaths(moonlightConfig: MoonlightConfig) {
  const ret = await Promise.all([
    moonlightGetStaticPathsIndex(moonlightConfig),
    moonlightGetStaticPathsEntries(moonlightConfig),
  ]);

  return ret.flat();
}
*/
