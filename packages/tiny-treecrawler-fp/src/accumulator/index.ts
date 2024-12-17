import type * as Effect from 'effect/Effect';

import type { TreeCrawlerData, TreeCrawlerEvent } from '../index.js';

export type TreeCrawlerAccumulator<T> = {
  readonly push: (eventType: TreeCrawlerEvent, eventData?: TreeCrawlerData) => TreeCrawlerAccumulator<T>;
  readonly data: () => Effect.Effect<T>;
};
