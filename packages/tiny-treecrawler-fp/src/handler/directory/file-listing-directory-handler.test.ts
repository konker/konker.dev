/* eslint-disable fp/no-mutation,fp/no-let */
import * as P from '@konker.dev/effect-ts-prelude';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';

import { TreeCrawlerDataType } from '../../index';
import * as memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './file-listing-directory-handler';

describe('default-directory-handler', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', async () => {
    const expected = {
      _tag: TreeCrawlerDataType.Directory,
      level: 2,
      path: '/tmp/foo',
      data: ['/tmp/foo/a.txt', '/tmp/foo/b.txt', '/tmp/foo/bar', '/tmp/foo/c.csv', '/tmp/foo/d.json'],
    };
    const actual = await P.Effect.runPromise(
      unit.FileListingTreeCrawlerDirectoryHandler(memFsTinyFileSystem, '/tmp/foo', 2)
    );
    expect(actual).toStrictEqual(P.Option.some(expected));
  });
});
