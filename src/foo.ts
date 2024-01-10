import * as P from '@konker.dev/effect-ts-prelude';
import * as E from '@konker.dev/tiny-event-fp';

import { NodeTinyFileSystem } from '../dist/lib/node';
import { BreadthFirstTreeCrawler } from './crawler/breadth-first-tree-crawler';
import { TrueDirectoryFilter } from './filter/directory/true-directory-filter';
import { TrueFileFilter } from './filter/file/true-file-filter';
import { DefaultTreeCrawlerDirectoryHandler } from './handler/directory/default-directory-handler';
import { DefaultTreeCrawlerFileHandler } from './handler/file/default-file-handler';
import type { TreeCrawlerData, TreeCrawlerEvent } from './index';

// eslint-disable-next-line fp/no-unused-expression
(async function main() {
  // const events = E.createTinyEventDispatcher<TreeCrawlerEvent, string>();

  const prg = P.pipe(
    P.Effect.Do,
    P.Effect.bind('events', () =>
      P.pipe(
        E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
        P.Effect.flatMap(E.addStarListener((eventType, eventData) => P.Console.log(eventType, eventData)))
      )
    ),
    P.Effect.bind('tfs', () => P.Effect.succeed(NodeTinyFileSystem)),
    (x) => x,
    P.Effect.flatMap(({ events, tfs }) =>
      P.pipe(
        '/tmp/foo',
        BreadthFirstTreeCrawler(
          tfs,
          events,
          [TrueFileFilter, TrueDirectoryFilter],
          [DefaultTreeCrawlerFileHandler, DefaultTreeCrawlerDirectoryHandler]
        )
      )
    )
  );

  return P.Effect.runPromise(prg);
})().catch(console.error);
