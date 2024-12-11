import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';
import { Option } from 'effect';
import * as Effect from 'effect/Effect';
import { beforeAll, describe, expect, it } from 'vitest';

import { TreeCrawlerDataType } from '../../index';
import memFs1Fixture from '../../test/fixtures/memfs-1.json';
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
    const actual = await Effect.runPromise(
      unit.FileListingTreeCrawlerDirectoryHandler(memFsTinyFileSystem, '/tmp/foo', 2)
    );
    expect(actual).toStrictEqual(Option.some(expected));
  });
});
