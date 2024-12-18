import { MOONLIGHT_NAVIGATION_TITLE_OVERVIEW, type MoonlightCollection, type MoonlightConfig } from './config';
import {
  moonlightGetAllIndexItems,
  moonlightGetAllItems,
  moonlightGetIndexItem,
  moonlightGetNextItem,
  moonlightGetPrevItem,
  moonlightGetSubCollectionItems,
} from './items';
import {
  createPathLookup,
  groupItemsByDepth,
  renameFirstHeading,
  renameIndexNavigationItem,
  shiftDepth,
} from './navigation';
import {
  MOONLIGHT_ENTRY_KIND_REGULAR,
  MOONLIGHT_PAGE_TYPE_ENTRY,
  MOONLIGHT_PAGE_TYPE_INDEX,
  type MoonlightItem,
  type MoonlightPagePropsEntry,
  type MoonlightPagePropsIndex,
} from './types';
import { RecordKeysOf } from './utils';

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
): StaticPathIndex => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  params: { moonlight_index_slug: collectionRootPagePath },
  props: {
    type: MOONLIGHT_PAGE_TYPE_INDEX,
    indexItems,
  },
});

// --------------------------------------------------------------------------
export const formatStaticPathEntry =
  <T extends MoonlightCollection>(allItems: Array<MoonlightItem<T>>) =>
  async (moonlightItem: MoonlightItem<T>): Promise<StaticPathEntry<T>> => {
    const { Content, headings } = await moonlightItem.entry.render();
    const headingGroups = groupItemsByDepth(shiftDepth(headings, -1), 1);

    const allSubCollectionItems = shiftDepth(
      moonlightGetSubCollectionItems(allItems, moonlightItem.subCollectionName),
      -1
    );
    const indexItem = moonlightGetIndexItem(allSubCollectionItems);
    const prevItem = moonlightGetPrevItem(allSubCollectionItems, moonlightItem);
    const nextItem = moonlightGetNextItem(allSubCollectionItems, moonlightItem);
    const subCollectionNavigation = groupItemsByDepth(allSubCollectionItems, 1);
    const navigationPathLookup = createPathLookup(allSubCollectionItems, indexItem, subCollectionNavigation);
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
        headingGroups: renameFirstHeading(headingGroups, MOONLIGHT_NAVIGATION_TITLE_OVERVIEW),
        subCollectionNavigation: renameIndexNavigationItem(
          subCollectionNavigation,
          MOONLIGHT_NAVIGATION_TITLE_OVERVIEW
        ),
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
    const indexItems = moonlightGetAllIndexItems(allItems);
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
