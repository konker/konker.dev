/* eslint-disable fp/no-mutation,fp/no-let */
import * as P from '@konker.dev/effect-ts-prelude';
import * as E from '@konker.dev/tiny-event-fp';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';

import { FalseDirectoryFilter } from '../filter/directory/false-directory-filter';
import { TrueDirectoryFilter } from '../filter/directory/true-directory-filter';
import { ExtensionFileFilter } from '../filter/file/extension-file-filter';
import { TrueFileFilter } from '../filter/file/true-file-filter';
import { DefaultTreeCrawlerDirectoryHandler } from '../handler/directory/default-directory-handler';
import { DefaultTreeCrawlerFileHandler } from '../handler/file/default-file-handler';
import type { TreeCrawlerData, TreeCrawlerEvent } from '../index';
import * as memFs1Fixture from '../test/fixtures/memfs-1.json';
import * as unit from './breadth-first-tree-crawler';

describe('breadth-first-tree-crawler', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', async () => {
    const mockListener = jest.fn().mockImplementation(() => P.Effect.unit);

    await P.Effect.runPromise(
      P.pipe(
        E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
        P.Effect.flatMap(E.addStarListener(mockListener)),
        P.Effect.flatMap((events) =>
          P.pipe(
            '/tmp/foo',
            unit.BreadthFirstTreeCrawler(
              memFsTinyFileSystem,
              events,
              [TrueFileFilter, TrueDirectoryFilter],
              [DefaultTreeCrawlerFileHandler, DefaultTreeCrawlerDirectoryHandler]
            )
          )
        )
      )
    );

    expect(mockListener.mock.calls).toStrictEqual([
      ['Started', undefined],
      ['Directory', { _tag: 'Directory', level: 0, path: '/tmp/foo' }],
      ['File', { _tag: 'File', data: ['A'], level: 1, path: '/tmp/foo/a.txt' }],
      ['File', { _tag: 'File', data: ['B'], level: 1, path: '/tmp/foo/b.txt' }],
      ['File', { _tag: 'File', data: ['bam,baz\ntrue,false\n'], level: 1, path: '/tmp/foo/c.csv' }],
      ['File', { _tag: 'File', data: ['{"bam": true, "baz":  false }'], level: 1, path: '/tmp/foo/d.json' }],
      ['Directory', { _tag: 'Directory', level: 1, path: '/tmp/foo/bar' }],
      ['File', { _tag: 'File', data: ['E'], level: 2, path: '/tmp/foo/bar/e.txt' }],
      ['File', { _tag: 'File', data: ['F'], level: 2, path: '/tmp/foo/bar/f.log' }],
      ['Finished', undefined],
    ]);
  });

  it('should work as expected', async () => {
    const mockListener = jest.fn().mockImplementation(() => P.Effect.unit);

    await P.Effect.runPromise(
      P.pipe(
        E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
        P.Effect.flatMap(E.addStarListener(mockListener)),
        P.Effect.flatMap((events) =>
          P.pipe(
            '/tmp/foo',
            unit.BreadthFirstTreeCrawler(
              memFsTinyFileSystem,
              events,
              [ExtensionFileFilter(['.txt']), FalseDirectoryFilter],
              [DefaultTreeCrawlerFileHandler, DefaultTreeCrawlerDirectoryHandler]
            )
          )
        )
      )
    );

    expect(mockListener.mock.calls).toStrictEqual([
      ['Started', undefined],
      ['Directory', { _tag: 'Directory', level: 0, path: '/tmp/foo' }],
      ['File', { _tag: 'File', data: ['A'], level: 1, path: '/tmp/foo/a.txt' }],
      ['File', { _tag: 'File', data: ['B'], level: 1, path: '/tmp/foo/b.txt' }],
      ['Finished', undefined],
    ]);
  });
});
