/* eslint-disable fp/no-mutating-methods,fp/no-unused-expression */
import * as P from '@konker.dev/effect-ts-prelude';
import * as E from '@konker.dev/tiny-event-fp';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';

import { DefaultTreeCrawlerAccumulator } from '../accumulator/DefaultTreeCrawlerAccumultor';
import { BreadthFirstTreeCrawler } from '../crawler/breadth-first-tree-crawler';
import { sequenceFileFilters } from '../filter';
import { TrueDirectoryFilter } from '../filter/directory/true-directory-filter';
import { ExtensionFileFilter } from '../filter/file/extension-file-filter';
import { TrueFileFilter } from '../filter/file/true-file-filter';
import { DefaultTreeCrawlerDirectoryHandler } from '../handler/directory/default-directory-handler';
import { DefaultTreeCrawlerFileHandler } from '../handler/file/default-file-handler';
import type { TreeCrawlerData, TreeCrawlerEvent } from '../index';
import * as memFs1Fixture from '../test/fixtures/memfs-1.json';

(async function main() {
  const prg = P.pipe(
    P.Effect.Do,
    P.Effect.bind('accumulator', () => P.Effect.succeed(DefaultTreeCrawlerAccumulator())),
    P.Effect.bind('events', ({ accumulator }) =>
      P.pipe(
        E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
        P.Effect.flatMap(
          E.addStarListener((_eventType: TreeCrawlerEvent, eventData?: TreeCrawlerData) => {
            accumulator.push(_eventType, eventData);
            return P.Effect.void;
          })
        )
      )
    ),
    P.Effect.bind('tfs', () => P.Effect.succeed(MemFsTinyFileSystem(memFs1Fixture, '/tmp'))),
    P.Effect.bind('data', ({ accumulator, events, tfs }) =>
      P.pipe(
        '/tmp/foo',
        BreadthFirstTreeCrawler(
          tfs,
          events,
          [sequenceFileFilters([TrueFileFilter, ExtensionFileFilter(['.txt', '.json', '.csv'])]), TrueDirectoryFilter],
          [DefaultTreeCrawlerFileHandler, DefaultTreeCrawlerDirectoryHandler]
        ),
        P.Effect.flatMap(() => accumulator.data())
      )
    ),
    P.Effect.tap(({ data }) => P.Console.log(data))
  );

  return P.Effect.runPromise(prg);
})().catch(console.error);
