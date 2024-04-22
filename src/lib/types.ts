import type { MarkdownHeading } from 'astro';
import type { CollectionEntry } from 'astro:content';

import type { TagCollection } from './collections';

export type LinkT = {
  readonly url: string;
  readonly title: string;
  readonly icon?: string;
};

export type SectionNavigationT = {
  readonly index: LinkT;
  readonly prev: LinkT | undefined;
  readonly next: LinkT | undefined;
};

export type TagEntryT<T extends TagCollection> = {
  readonly collection: T;
  readonly entry: CollectionEntry<T>;
};

export type HeadingsList = Array<MarkdownHeading | HeadingsList>;
