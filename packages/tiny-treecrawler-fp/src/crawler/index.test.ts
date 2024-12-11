import * as E from '@konker.dev/tiny-event-fp';
import { stringToUint8Array } from '@konker.dev/tiny-filesystem-fp/dist/lib/array';
import { Option, pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TreeCrawlerData, TreeCrawlerEvent } from '../index';
import { TreeCrawlerDataType } from '../index';
import * as unit from './index';

describe('crawler', () => {
  const mockDirectoryListener = vi.fn().mockImplementation(() => Effect.void);
  const mockFileListener = vi.fn().mockImplementation(() => Effect.void);

  describe('notifyDirectoryEvent', () => {
    afterEach(() => {
      mockDirectoryListener.mockReset();
    });

    const events = pipe(
      E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
      Effect.flatMap(E.addStarListener(mockDirectoryListener))
    );

    it('should work as expected', async () => {
      await Effect.runPromise(
        pipe(
          events,
          Effect.flatMap((events) =>
            pipe(
              unit.notifyDirectoryEvent(
                events,
                Option.some({ _tag: TreeCrawlerDataType.Directory, level: 0, path: '/tmp/foo' })
              )
            )
          )
        )
      );

      expect(mockDirectoryListener).toHaveBeenCalledTimes(1);
      expect(mockDirectoryListener.mock.calls).toStrictEqual([
        ['Directory', { _tag: TreeCrawlerDataType.Directory, level: 0, path: '/tmp/foo' }],
      ]);
    });

    it('should work as expected', async () => {
      await Effect.runPromise(
        pipe(
          events,
          Effect.flatMap((events) => pipe(unit.notifyDirectoryEvent(events, Option.none())))
        )
      );

      expect(mockDirectoryListener).toHaveBeenCalledTimes(0);
    });
  });

  describe('notifyFileEvent', () => {
    afterEach(() => {
      mockFileListener.mockReset();
    });

    const events = pipe(
      E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
      Effect.flatMap(E.addStarListener(mockFileListener))
    );

    it('should work as expected', async () => {
      await Effect.runPromise(
        pipe(
          events,
          Effect.flatMap((events) =>
            pipe(
              unit.notifyFileEvent(
                events,
                Option.some({
                  _tag: TreeCrawlerDataType.File,
                  level: 0,
                  path: '/tmp/foo/a.txt',
                  data: stringToUint8Array('A'),
                })
              )
            )
          )
        )
      );

      expect(mockFileListener).toHaveBeenCalledTimes(1);
      expect(mockFileListener.mock.calls).toStrictEqual([
        ['File', { _tag: TreeCrawlerDataType.File, data: stringToUint8Array('A'), level: 0, path: '/tmp/foo/a.txt' }],
      ]);
    });

    it('should work as expected', async () => {
      await Effect.runPromise(
        pipe(
          events,
          Effect.flatMap((events) => pipe(unit.notifyFileEvent(events, Option.none())))
        )
      );

      expect(mockFileListener).toHaveBeenCalledTimes(0);
    });
  });
});
