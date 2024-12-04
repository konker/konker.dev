import type * as P from '@konker.dev/effect-ts-prelude';

import type { TreeCrawlerData, TreeCrawlerEvent } from '../index';

export type TreeCrawlerAccumulator<T> = {
  readonly push: (eventType: TreeCrawlerEvent, eventData?: TreeCrawlerData) => TreeCrawlerAccumulator<T>;
  readonly data: () => P.Effect.Effect<T>;
};
