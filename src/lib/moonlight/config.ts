export const MOONLIGHT_COLLECTION_NAMES = ['projects'] as const;
export type MoonlightCollectionName = (typeof MOONLIGHT_COLLECTION_NAMES)[number];

export type MoonlightConfig = {
  readonly [key in MoonlightCollectionName]?: `/${string}`;
};

export const MOONLIGHT_CONFIG: MoonlightConfig = {
  projects: '/projects',
} as const;
