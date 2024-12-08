import * as P from '@konker.dev/effect-ts-prelude';

import type { TreeCrawlerData, TreeCrawlerEvent } from '../index';
import type { TreeCrawlerAccumulator } from './index';

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
    data: () => P.Effect.succeed(acc),
  };

  return rep;
};
