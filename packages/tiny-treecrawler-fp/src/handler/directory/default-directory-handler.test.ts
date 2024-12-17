import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/memfs';
import { Option } from 'effect';
import * as Effect from 'effect/Effect';
import { beforeAll, describe, expect, it } from 'vitest';

import { TreeCrawlerDataType } from '../../index.js';
import memFs1Fixture from '../../test/fixtures/memfs-1.json' with { type: 'json' };
import * as unit from './default-directory-handler.js';

describe('default-directory-handler', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(unit.DefaultTreeCrawlerDirectoryHandler(memFsTinyFileSystem, '/foo', 1)).toStrictEqual(
      Effect.succeed(Option.some({ _tag: TreeCrawlerDataType.Directory, level: 1, path: '/foo' }))
    );
  });
});
