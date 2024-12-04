import * as P from '@konker.dev/effect-ts-prelude';
import * as E from '@konker.dev/tiny-event-fp';
import { stringToUint8Array } from '@konker.dev/tiny-filesystem-fp/dist/lib/array';

import type { TreeCrawlerData, TreeCrawlerEvent } from '../index';
import { TreeCrawlerDataType } from '../index';
import * as unit from './index';

describe('crawler', () => {
  const mockDirectoryListener = jest.fn().mockImplementation(() => P.Effect.void);
  const mockFileListener = jest.fn().mockImplementation(() => P.Effect.void);

  describe('notifyDirectoryEvent', () => {
    afterEach(() => {
      mockDirectoryListener.mockReset();
    });

    const events = P.pipe(
      E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
      P.Effect.flatMap(E.addStarListener(mockDirectoryListener))
    );

    it('should work as expected', async () => {
      await P.Effect.runPromise(
        P.pipe(
          events,
          P.Effect.flatMap((events) =>
            P.pipe(
              unit.notifyDirectoryEvent(
                events,
                P.Option.some({ _tag: TreeCrawlerDataType.Directory, level: 0, path: '/tmp/foo' })
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
      await P.Effect.runPromise(
        P.pipe(
          events,
          P.Effect.flatMap((events) => P.pipe(unit.notifyDirectoryEvent(events, P.Option.none())))
        )
      );

      expect(mockDirectoryListener).toHaveBeenCalledTimes(0);
    });
  });

  describe('notifyFileEvent', () => {
    afterEach(() => {
      mockFileListener.mockReset();
    });

    const events = P.pipe(
      E.createTinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>(),
      P.Effect.flatMap(E.addStarListener(mockFileListener))
    );

    it('should work as expected', async () => {
      await P.Effect.runPromise(
        P.pipe(
          events,
          P.Effect.flatMap((events) =>
            P.pipe(
              unit.notifyFileEvent(
                events,
                P.Option.some({
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
      await P.Effect.runPromise(
        P.pipe(
          events,
          P.Effect.flatMap((events) => P.pipe(unit.notifyFileEvent(events, P.Option.none())))
        )
      );

      expect(mockFileListener).toHaveBeenCalledTimes(0);
    });
  });
});
