import type { MarkdownHeading } from 'astro';

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

export type HeadingsList = Array<MarkdownHeading | HeadingsList>;
