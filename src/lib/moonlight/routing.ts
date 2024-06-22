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
  moonlightGetSubCollectionItems,
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
  collectionRootPagePath: string,
  indexItems: Array<MoonlightItem<T>>
): StaticPathIndex => {
  console.log(
    'KONK90',
    indexItems.map((x: any) => [x.entry.data.indexOrder, x.path])
  );
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    params: { moonlight_index_slug: collectionRootPagePath },
    props: {
      type: MOONLIGHT_PAGE_TYPE_INDEX,
      indexItems,
    },
  };
};

// --------------------------------------------------------------------------
export const formatStaticPathEntry =
  <T extends MoonlightCollection>(allItems: Array<MoonlightItem<T>>) =>
  async (moonlightItem: MoonlightItem<T>): Promise<StaticPathEntry<T>> => {
    const { Content, headings } = await moonlightItem.entry.render();
    const headingGroups = groupItemsByDepth(headings);

    const allSubCollectionItems = moonlightGetSubCollectionItems(allItems, moonlightItem.subCollectionName);
    const prevItem = moonlightGetPrevItem(allSubCollectionItems, moonlightItem);
    const nextItem = moonlightGetNextItem(allSubCollectionItems, moonlightItem);
    const subCollectionNavigation = groupItemsByDepth(allSubCollectionItems);
    const navigationPathLookup = createPathLookup(allSubCollectionItems, subCollectionNavigation);
    const breadcrumbNavigation = navigationPathLookup[moonlightItem.path] ?? [];

    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      params: { moonlight_slug: `${moonlightItem.collectionRootPagesPath}/${moonlightItem.entry.slug}` },
      props: {
        type: MOONLIGHT_PAGE_TYPE_ENTRY,
        kind: moonlightItem.entry.data.kind ?? MOONLIGHT_ENTRY_KIND_REGULAR,

        item: moonlightItem,
        Content,
        headings,
        headingGroups,
        subCollectionNavigation,
        breadcrumbNavigation,
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
    const indexItems = moonlightGetIndexItems(allItems);
    console.log(
      'KONK80',
      indexItems.map((x: any) => [x.entry.data.indexOrder, x.path])
    );
    const rootIndexStaticPath = formatStaticPathIndex(collectionRootPagePath, indexItems);

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
    const allItems = await moonlightGetAllItems(collectionName, collectionRootPagePath);
    const contentPaths = await Promise.all(allItems.map(formatStaticPathEntry(allItems)));

    ret.push(contentPaths);
  }
  return ret.flat();
}
