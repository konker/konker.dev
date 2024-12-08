import * as P from '@konker.dev/effect-ts-prelude';

import type { TreeCrawlerData, TreeCrawlerEvent } from '../index';
import type { TreeCrawlerAccumulator } from './index';

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
    data: () => P.Effect.succeed(acc),
  };

  return rep;
};
