import type { MarkdownHeading } from 'astro';
import type { Props } from 'lucide-astro';

export type LinkT = {
  readonly url: string;
  readonly title: string;
  readonly Icon?: ((props: Props) => any) | undefined;
  readonly textClass?: string | undefined;
};

export type SectionNavigationT = {
  readonly index: LinkT;
  readonly prev: LinkT | undefined;
  readonly next: LinkT | undefined;
};

export type HeadingsList = Array<MarkdownHeading | HeadingsList>;
