/* eslint-disable fp/no-mutating-methods,fp/no-unused-expression */
import * as E from '@konker.dev/tiny-event-fp';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';
import { Console, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import { DefaultTreeCrawlerAccumulator } from '../accumulator/DefaultTreeCrawlerAccumultor';
import { BreadthFirstTreeCrawler } from '../crawler/breadth-first-tree-crawler';
import { sequenceFileFilters } from '../filter';
import { TrueDirectoryFilter } from '../filter/directory/true-directory-filter';
import { ExtensionFileFilter } from '../filter/file/extension-file-filter';
import { TrueFileFilter } from '../filter/file/true-file-filter';
import { DefaultTreeCrawlerDirectoryHandler } from '../handler/directory/default-directory-handler';
import { DefaultTreeCrawlerFileHandler } from '../handler/file/default-file-handler';
import type { TreeCrawlerData, TreeCrawlerEvent } from '../index';
import memFs1Fixture from '../test/fixtures/memfs-1.json';

(async function main() {
  const prg = pipe(
    Effect.Do,
    Effect.bind('accumulator', () => Effect.succeed(DefaultTreeCrawlerAccumulator())),
    Effect.bind('events', ({ accumulator }) =>
      pipe(
        E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
        Effect.flatMap(
          E.addStarListener((_eventType: TreeCrawlerEvent, eventData?: TreeCrawlerData) => {
            accumulator.push(_eventType, eventData);
            return Effect.void;
          })
        )
      )
    ),
    Effect.bind('tfs', () => Effect.succeed(MemFsTinyFileSystem(memFs1Fixture, '/tmp'))),
    Effect.bind('data', ({ accumulator, events, tfs }) =>
      pipe(
        '/tmp/foo',
        BreadthFirstTreeCrawler(
          tfs,
          events,
          [sequenceFileFilters([TrueFileFilter, ExtensionFileFilter(['.txt', '.json', '.csv'])]), TrueDirectoryFilter],
          [DefaultTreeCrawlerFileHandler, DefaultTreeCrawlerDirectoryHandler]
        ),
        Effect.flatMap(() => accumulator.data())
      )
    ),
    Effect.tap(({ data }) => Console.log(data))
  );

  return Effect.runPromise(prg);
})().catch(console.error);
