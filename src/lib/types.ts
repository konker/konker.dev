export type Collections = 'til' | 'projects';

export type Breadcrumb = {
  readonly url: string;
  readonly title: string;
  readonly icon?: string;
};

export type Breadcrumbs = ReadonlyArray<Breadcrumb>;

export type SectionNavigation = {
  readonly index: Breadcrumb;
  readonly prev: Breadcrumb | undefined;
  readonly next: Breadcrumb | undefined;
};
