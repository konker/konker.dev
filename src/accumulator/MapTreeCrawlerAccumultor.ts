import * as P from '@konker.dev/effect-ts-prelude';

import type { TreeCrawlerData, TreeCrawlerEvent } from '../index';
import type { TreeCrawlerAccumulator } from './index';

export const MapTreeCrawlerAccumulator =
  <T>(fn: (event: TreeCrawlerEvent, data: TreeCrawlerData) => T) =>
  (accInit: Array<T> = []): TreeCrawlerAccumulator<Array<T>> => {
    // eslint-disable-next-line fp/no-let
    let acc: Array<T> = [...accInit];

    const rep = {
      push: (eventType: TreeCrawlerEvent, eventData?: TreeCrawlerData) => {
        // eslint-disable-next-line fp/no-mutating-methods,fp/no-this,fp/no-unused-expression,fp/no-mutation
        if (eventData) acc = [...acc, fn(eventType, eventData)];
        return rep;
      },
      data: () => P.Effect.succeed(acc),
    };

    return rep;
  };
