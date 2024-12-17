import { stringToUint8Array } from '@konker.dev/tiny-filesystem-fp/lib/array';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { TreeCrawlerDataType, TreeCrawlerEvent } from '../index.js';
import * as unit from './MapTreeCrawlerAccumultor.js';

describe('accumulator', () => {
  describe('MapTreeCrawlerAccumulator', () => {
    it('should work as expected', () => {
      const accumulator = unit.MapTreeCrawlerAccumulator((event, _data) => `FOO_${event}`);
      accumulator.push(TreeCrawlerEvent.Directory, { _tag: TreeCrawlerDataType.Directory, level: 1, path: '/tmp/foo' });
      accumulator.push(TreeCrawlerEvent.File, {
        _tag: TreeCrawlerDataType.File,
        level: 1,
        path: '/tmp/foo/a.txt',
        data: stringToUint8Array('A'),
      });
      accumulator.push(TreeCrawlerEvent.File);

      expect(accumulator.data()).toStrictEqual(Effect.succeed(['FOO_Directory', 'FOO_File']));
    });
  });
});
