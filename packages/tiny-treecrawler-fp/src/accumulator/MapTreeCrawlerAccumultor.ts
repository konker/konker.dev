import * as Effect from 'effect/Effect';

import type { TreeCrawlerData, TreeCrawlerEvent } from '../index.js';
import type { TreeCrawlerAccumulator } from './index.js';

export const MapTreeCrawlerAccumulator = <T>(
  fn: (event: TreeCrawlerEvent, data: TreeCrawlerData) => T
): TreeCrawlerAccumulator<Array<T>> => {
  // eslint-disable-next-line fp/no-let
  let acc: Array<T> = [];

  const rep = {
    push: (eventType: TreeCrawlerEvent, eventData?: TreeCrawlerData) => {
      if (eventData) {
        // eslint-disable-next-line fp/no-mutation
        acc = [...acc, fn(eventType, eventData)];
      }
      return rep;
    },
    data: () => Effect.succeed(acc),
  };

  return rep;
};
