import * as E from '@konker.dev/tiny-event-fp';
import { stringToUint8Array } from '@konker.dev/tiny-filesystem-fp/lib/array';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/memfs';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { FalseDirectoryFilter } from '../filter/directory/false-directory-filter.js';
import { TrueDirectoryFilter } from '../filter/directory/true-directory-filter.js';
import { ExtensionFileFilter } from '../filter/file/extension-file-filter.js';
import { TrueFileFilter } from '../filter/file/true-file-filter.js';
import { DefaultTreeCrawlerDirectoryHandler } from '../handler/directory/default-directory-handler.js';
import { DefaultTreeCrawlerFileHandler } from '../handler/file/default-file-handler.js';
import type { TreeCrawlerData, TreeCrawlerEvent } from '../index.js';
import memFs1Fixture from '../test/fixtures/memfs-1.json' with { type: 'json' };
import * as unit from './breadth-first-tree-crawler.js';

describe('breadth-first-tree-crawler', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', async () => {
    const mockListener = vi.fn().mockImplementation(() => Effect.void);

    await Effect.runPromise(
      pipe(
        E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
        Effect.flatMap(E.addStarListener(mockListener)),
        Effect.flatMap((events) =>
          pipe(
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
      ['File', { _tag: 'File', data: stringToUint8Array('A'), level: 1, path: '/tmp/foo/a.txt' }],
      ['File', { _tag: 'File', data: stringToUint8Array('B'), level: 1, path: '/tmp/foo/b.txt' }],
      ['File', { _tag: 'File', data: stringToUint8Array('bam,baz\ntrue,false\n'), level: 1, path: '/tmp/foo/c.csv' }],
      [
        'File',
        { _tag: 'File', data: stringToUint8Array('{"bam": true, "baz":  false }'), level: 1, path: '/tmp/foo/d.json' },
      ],
      ['Directory', { _tag: 'Directory', level: 1, path: '/tmp/foo/bar' }],
      ['File', { _tag: 'File', data: stringToUint8Array('E'), level: 2, path: '/tmp/foo/bar/e.txt' }],
      ['File', { _tag: 'File', data: stringToUint8Array('F'), level: 2, path: '/tmp/foo/bar/f.log' }],
      ['Finished', undefined],
    ]);
  });

  it('should work as expected', async () => {
    const mockListener = vi.fn().mockImplementation(() => Effect.void);

    await Effect.runPromise(
      pipe(
        E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
        Effect.flatMap(E.addStarListener(mockListener)),
        Effect.flatMap((events) =>
          pipe(
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
      ['File', { _tag: 'File', data: stringToUint8Array('A'), level: 1, path: '/tmp/foo/a.txt' }],
      ['File', { _tag: 'File', data: stringToUint8Array('B'), level: 1, path: '/tmp/foo/b.txt' }],
      ['Finished', undefined],
    ]);
  });
});
