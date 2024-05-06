import { type CollectionEntry, getCollection } from 'astro:content';

import type { LinkT } from '../types.ts';
import { notDraftFilterPredicate } from './helpers.ts';
import { type TagCollection } from './index';

// --------------------------------------------------------------------------
export type TagT = {
  readonly tag: string;
  readonly count: number;
};

export type TagLinkT = {
  readonly tag: string;
  readonly count: number;
  readonly link: LinkT;
};

export type TagSorterT = (tags: ReadonlyArray<TagT>) => ReadonlyArray<TagT>;

export type TagEntry<T extends TagCollection> = {
  readonly collection: T;
  readonly entry: CollectionEntry<T>;
};

// --------------------------------------------------------------------------
export function tagsSorterCountDesc(tags: ReadonlyArray<TagT>): ReadonlyArray<TagT> {
  return tags.toSorted((a, b) => b.count - a.count);
}

// --------------------------------------------------------------------------
export async function tagsGetAllCollectionTags(
  collections: ReadonlyArray<TagCollection>,
  sorter: TagSorterT = tagsSorterCountDesc
): Promise<{ readonly total: number; readonly tags: ReadonlyArray<TagT> }> {
  const allEntries = await Promise.all(collections.map((collection) => getCollection(collection)));
  const filteredEntries = allEntries.flat().filter(notDraftFilterPredicate);
  const allTags = filteredEntries.flatMap((x) => x.data.tags ?? []);

  const tagCounts = allTags.reduce(
    (acc, val) => {
      if (val in acc) {
        return { ...acc, [val]: acc[val]! + 1 };
      }
      return { ...acc, [val]: 1 };
    },
    {} as Record<string, number>
  );
  const tags = Object.keys(tagCounts);

  return {
    total: tags.length,
    tags: sorter(tags.map((tag) => ({ tag, count: tagCounts[tag]! }))),
  };
}

// --------------------------------------------------------------------------
export async function tagsGetAllCollectionTagEntries<T extends TagCollection>(
  collections: ReadonlyArray<T>
): Promise<ReadonlyArray<TagEntry<T>>> {
  const allEntries = await Promise.all(collections.map((collection) => getCollection(collection)));
  const allTagEntries = allEntries.reduce(
    (acc, entries, i) => {
      const collection: T = collections[i]!;
      const tagEntries = entries.map(
        (entry: CollectionEntry<T>): TagEntry<T> => ({
          entry,
          collection,
        })
      );
      return [...acc, ...tagEntries];
    },
    [] as ReadonlyArray<TagEntry<T>>
  );

  return allTagEntries.filter((x) => notDraftFilterPredicate(x.entry));
}
