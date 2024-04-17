import type { CollectionEntry } from 'astro:content';

import type { TagCollection } from './collections';

export type BreadcrumbT = {
  readonly url: string;
  readonly title: string;
  readonly icon?: string;
};

export type SectionNavigationT = {
  readonly index: BreadcrumbT;
  readonly prev: BreadcrumbT | undefined;
  readonly next: BreadcrumbT | undefined;
};

export type TagEntryT<T extends TagCollection> = {
  readonly collection: T;
  readonly entry: CollectionEntry<T>;
};
