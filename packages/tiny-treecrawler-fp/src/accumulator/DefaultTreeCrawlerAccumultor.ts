import * as Effect from 'effect/Effect';

import type { TreeCrawlerData, TreeCrawlerEvent } from '../index.js';
import type { TreeCrawlerAccumulator } from './index.js';

export type DefaultAccumulatorItem = [TreeCrawlerEvent, TreeCrawlerData];

export const DefaultTreeCrawlerAccumulator = (): TreeCrawlerAccumulator<Array<DefaultAccumulatorItem>> => {
  // eslint-disable-next-line fp/no-let
  let acc: Array<DefaultAccumulatorItem> = [];

  const rep = {
    push: (eventType: TreeCrawlerEvent, eventData?: TreeCrawlerData) => {
      if (eventData) {
        // eslint-disable-next-line fp/no-mutation
        acc = [...acc, [eventType, eventData]];
      }
      return rep;
    },
    data: () => Effect.succeed(acc),
  };

  return rep;
};
