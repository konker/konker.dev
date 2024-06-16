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
import { createPathLookup, groupItemsByDepth } from './navigation.ts';
import { RecordKeysOf } from './utils.ts';

// --------------------------------------------------------------------------
export type StaticPathIndex = {
  readonly params: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly moonlight_index_slug: string;
  };
  props: MoonlightPagePropsIndex;
};

export type StaticPathEntry<T extends MoonlightCollection> = {
  readonly params: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    readonly moonlight_slug: string;
  };
  props: MoonlightPagePropsEntry<T>;
};

// --------------------------------------------------------------------------
export const formatStaticPathIndex = <T extends MoonlightCollection>(
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
  <T extends MoonlightCollection>(allItems: Array<MoonlightItem<T>>) =>
  async (moonlightItem: MoonlightItem<T>): Promise<StaticPathEntry<T>> => {
    const { Content, headings } = await moonlightItem.entry.render();
    const allProjectItems = moonlightGetProjectItems(allItems, moonlightItem.project);
    const prevItem = moonlightGetPrevItem(allProjectItems, moonlightItem);
    const nextItem = moonlightGetNextItem(allProjectItems, moonlightItem);
    const projectNavigation = groupItemsByDepth(allProjectItems);
    const navigationPathLookup = createPathLookup(allProjectItems, projectNavigation);

    fs.writeFileSync('/tmp/KONK60.json', JSON.stringify(allProjectItems, null, 2));
    fs.writeFileSync('/tmp/KONK61.json', JSON.stringify(groupItemsByDepth(allProjectItems, 1), null, 2));
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      params: { moonlight_slug: `${moonlightItem.collectionRootPagesPath}/${moonlightItem.entry.slug}` },
      props: {
        type: MOONLIGHT_PAGE_TYPE_ENTRY,
        kind: moonlightItem.entry.data.kind ?? MOONLIGHT_ENTRY_KIND_REGULAR,

        item: moonlightItem,
        Content,
        headings,
        headingGroups: groupItemsByDepth(headings),
        projectNavigation,
        breadcrumbNavigation: navigationPathLookup[moonlightItem.path] ?? [],
        prevItem,
        nextItem,
      },
    };
  };

// --------------------------------------------------------------------------
export async function moonlightGetStaticPathsIndex(moonlightConfig: MoonlightConfig): Promise<Array<StaticPathIndex>> {
  const ret = [];

  for (const collectionName of RecordKeysOf(moonlightConfig)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const collectionRootPagePath = `/${collectionName}`;
    const allItems = await moonlightGetAllItems(collectionName, collectionRootPagePath);
    const rootIndexStaticPath = formatStaticPathIndex(allItems, collectionRootPagePath);

    ret.push(rootIndexStaticPath);
  }
  return ret;
}

// --------------------------------------------------------------------------
export async function moonlightGetStaticPathsEntries(
  moonlightConfig: MoonlightConfig
): Promise<Array<StaticPathEntry<MoonlightCollection>>> {
  const ret = [];

  for (const collectionName of RecordKeysOf(moonlightConfig)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const collectionRootPagePath = `/${collectionName}`;
    const allEntries = await moonlightGetAllItems(collectionName, collectionRootPagePath);
    const contentPaths = await Promise.all(allEntries.map(formatStaticPathEntry(allEntries)));

    ret.push(contentPaths);
  }
  return ret.flat();
}
