/* eslint-disable fp/no-let,fp/no-mutation */
import * as P from '@konker.dev/effect-ts-prelude';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';

import { TreeCrawlerDataType } from '../../index';
import * as memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './default-file-handler';

describe('default-file-handler', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', async () => {
    const expected = { _tag: TreeCrawlerDataType.File, level: 1, path: '/tmp/foo/a.txt', data: ['A'] };
    const actual = await P.Effect.runPromise(
      unit.DefaultTreeCrawlerFileHandler(memFsTinyFileSystem, '/tmp/foo', 'a.txt', 1)
    );
    expect(actual).toStrictEqual(P.Option.some(expected));
  });
});
