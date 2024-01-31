/* eslint-disable fp/no-mutation,fp/no-let */
import * as P from '@konker.dev/effect-ts-prelude';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';

import { TreeCrawlerDataType } from '../../index';
import * as memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './default-directory-handler';

describe('default-directory-handler', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(unit.DefaultTreeCrawlerDirectoryHandler(memFsTinyFileSystem, '/foo', 1)).toStrictEqual(
      P.Effect.succeed(P.Option.some({ _tag: TreeCrawlerDataType.Directory, level: 1, path: '/foo' }))
    );
  });
});
