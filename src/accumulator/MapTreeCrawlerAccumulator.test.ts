/* eslint-disable fp/no-mutating-methods */
import * as P from '@konker.dev/effect-ts-prelude';

import { TreeCrawlerEvent } from '../index';
import * as unit from './MapTreeCrawlerAccumultor';

describe('accumulator', () => {
  describe('MapTreeCrawlerAccumulator', () => {
    it('should work as expected', () => {
      const accumulator = unit.MapTreeCrawlerAccumulator((event, _data) => `FOO_${event}`);
      accumulator.push(TreeCrawlerEvent.Directory, { _tag: 'Directory', level: 1, path: '/tmp/foo' });
      accumulator.push(TreeCrawlerEvent.File, { _tag: 'File', level: 1, path: '/tmp/foo/a.txt', data: ['A'] });

      expect(accumulator.data()).toStrictEqual(P.Effect.succeed(['FOO_Directory', 'FOO_File']));
    });
  });
});
