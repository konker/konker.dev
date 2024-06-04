export type HasDepthT = { readonly depth: number };
export type DepthGroupT<T extends HasDepthT> = Array<T | DepthGroupT<T>>;

/**
 * Recursive function to group items by their `depth` property.
 * Depth should be 1-based.
 *
 * E.g. converts:
 * `[ { depth: 1 }, { depth: 1}, { depth: 2 }, { depth: 3 }, { depth: 1 }]`
 * Into:
 * `[{ depth: 1 }, { depth: 1 }, [{ depth: 2 }, [{ depth: 3 }] ], { depth: 1 }]`
 */
export function groupItemsByDepth<T extends HasDepthT>(items: Array<T>, depth = 1): DepthGroupT<T> {
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
