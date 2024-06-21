// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
type ImportMetaEnv = {
  readonly SITE_ANALYTICS_BEAM_TOKEN: string;
};

type ImportMeta = {
  readonly env: ImportMetaEnv;
};
