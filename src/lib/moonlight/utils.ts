// --------------------------------------------------------------------------
export type KeyOf<T extends object> = keyof T;

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
