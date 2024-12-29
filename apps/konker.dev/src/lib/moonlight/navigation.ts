/* eslint-disable */
import type { MoonlightCollection } from './config';
import { isItemIndexFilterPredicate } from './items';
import type { DepthGroupT, HasDepthT, HasPathT, HasTextT, MoonlightItem } from './types';
import { isArray, pairWise } from './utils';

// --------------------------------------------------------------------------
export function shiftDepth<T extends HasDepthT>(items: Array<T>, shift: number): Array<T> {
  return items.map((x) => ({ ...x, depth: Math.max(1, x.depth + shift) }));
}

// --------------------------------------------------------------------------
/**
 * Recursive function to group items by their `depth` property.
 * Depth should be 1-based.
 *
 * E.g. converts:
 * `[ { depth: 1 }, { depth: 1}, { depth: 2 }, { depth: 3 }, { depth: 1 }]`
 * Into:
 * `[{ depth: 1 }, { depth: 1 }, [{ depth: 2 }, [{ depth: 3 }] ], { depth: 1 }]`
 */
export function groupItemsByDepth<T extends HasDepthT>(items: Array<T>, depth: number): DepthGroupT<T> {
  let skipIdx = -1;
  return items.reduce((acc, val, i) => {
    if (skipIdx !== -1 && i < skipIdx) {
      return acc;
    }
    if (val.depth !== depth) {
      // Find the next heading with the current depth
      const nextDepthIdx = items.slice(i).findIndex((x) => x.depth === depth);
      const j = nextDepthIdx === -1 ? items.length : i + nextDepthIdx;
      skipIdx = j;

      // Recurse for sub-list
      return [...acc, groupItemsByDepth(items.slice(i, j), val.depth)];
    }
    return acc.concat(val);
  }, [] as DepthGroupT<T>);
}

// --------------------------------------------------------------------------
/**
 * TODO: comments
 */
export function createPathLookup<T extends HasPathT>(
  allItems: Array<T>,
  indexItem: T,
  groupedItems: DepthGroupT<T>
): Record<string, Array<T>> {
  function _searchPath(groupedItems: DepthGroupT<T>, path: string, acc: Array<T>): Array<T> {
    if (groupedItems.length === 1) {
      const a = groupedItems[0]!;
      if (isArray(a)) {
        return acc;
      } else if (a.path === path) {
        // We have found the target in the only item
        return [...acc, a];
      }
    }

    for (const [a, b] of pairWise(groupedItems)) {
      if (isArray(a)) {
        // We already checked this array as b, so skip it
        continue;
      }
      if (a.path === path) {
        // We have found the target in a
        return [...acc, a];
      }
      if (isArray(b)) {
        // b is an array, so the target could be in a sub-list
        const _subAcc: Array<T> = _searchPath(b, path, [a]);
        if (_subAcc.length > 1) {
          // We have found the target in a sub-list
          return [...acc, ..._subAcc];
        }
      } else if (b.path === path) {
        // We have found the target in b
        return [...acc, b];
      }
    }
    return acc;
  }

  const allPaths = allItems.map((x) => x.path);
  const ret = allPaths.reduce((acc, val) => {
    return {
      ...acc,
      [val]: _searchPath(groupedItems, val, indexItem.path === val ? [] : [indexItem]),
    };
  }, {});
  return ret;
}

// --------------------------------------------------------------------------
export function renameFirstHeading<T extends HasTextT>(headings: DepthGroupT<T>, newTitle: string): DepthGroupT<T> {
  if (headings.length > 0) {
    const firstHeading = headings[0]!;
    if (!isArray(firstHeading) && firstHeading.depth === 1) {
      return [{ ...firstHeading, text: newTitle }, ...headings.slice(1)];
    }
  }
  return headings;
}

// --------------------------------------------------------------------------
export function renameIndexNavigationItem<T extends MoonlightCollection>(
  items: DepthGroupT<MoonlightItem<T>>,
  newTitle: string
): DepthGroupT<MoonlightItem<T>> {
  const indexItemIdx = items.findIndex((x) => !isArray(x) && isItemIndexFilterPredicate(x));
  if (indexItemIdx !== -1) {
    const indexItem = items[indexItemIdx]! as MoonlightItem<T>;
    return [
      ...items.slice(0, indexItemIdx),
      { ...indexItem, entry: { ...indexItem.entry, data: { ...indexItem.entry.data, title: newTitle } } },
      ...items.slice(indexItemIdx + 1),
    ];
  }
  return items;
}
