import * as P from '@konker.dev/effect-ts-prelude';

import type { TreeCrawlerData, TreeCrawlerEvent } from '../index';

export type AccumulatorItem = [TreeCrawlerEvent, TreeCrawlerData];

export type TreeCrawlerAccumulator = {
  readonly push: (eventType: TreeCrawlerEvent, eventData?: TreeCrawlerData) => TreeCrawlerAccumulator;
  readonly data: () => P.Effect.Effect<never, never, Array<AccumulatorItem>>;
};

export const DefaultTreeCrawlerAccumulator = (accInit: Array<AccumulatorItem> = []): TreeCrawlerAccumulator => {
  // eslint-disable-next-line fp/no-let
  let acc: Array<AccumulatorItem> = [...accInit];

  const rep = {
    // eslint-disable-next-line fp/no-nil
    push: (eventType: TreeCrawlerEvent, eventData?: TreeCrawlerData) => {
      // eslint-disable-next-line fp/no-mutating-methods,fp/no-this,fp/no-unused-expression,fp/no-mutation
      if (eventData) acc = [...acc, [eventType, eventData]];
      return rep;
    },
    data: () => P.Effect.succeed(acc),
  };

  return rep;
};
