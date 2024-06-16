// --------------------------------------------------------------------------
export type KeyOf<T extends object> = keyof T;

export function isArray<T>(x: T | Array<T>): x is Array<T> {
  return Array.isArray(x);
}

export function isNotArray<T>(x: T | Array<T>): x is T {
  return !isArray(x);
}

// --------------------------------------------------------------------------
export function RecordKeysOf<T extends object>(record: T): Array<KeyOf<T>> {
  return Object.keys(record) as Array<KeyOf<T>>;
}

export function getSlugPathParts(slug: string): Array<string> {
  return slug.split('/').filter((part) => part.length > 0);
}

export function countSlugPathParts(slug: string): number {
  return getSlugPathParts(slug).length;
}

export function extractProject(slug: string): string {
  const slugParts = slug.split('/');
  return slugParts[0]!;
}

/**
 * Generate a pair-wise array from the given array.
 * E.g. pairWise([1,2,3,4]) => [ [1,2], [2,3], [3,4] ]
 */
export function pairWise<T>(a: Array<T>): Array<[T, T]> {
  return a.slice(1).map((k, i) => [a[i]!, k]);
}
