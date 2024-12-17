import { stringToUint8Array } from '@konker.dev/tiny-filesystem-fp/lib/array';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/memfs';
import { Option } from 'effect';
import * as Effect from 'effect/Effect';
import { beforeAll, describe, expect, it } from 'vitest';

import { TreeCrawlerDataType } from '../../index.js';
import memFs1Fixture from '../../test/fixtures/memfs-1.json' with { type: 'json' };
import * as unit from './default-file-handler.js';

describe('default-file-handler', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', async () => {
    const expected = {
      _tag: TreeCrawlerDataType.File,
      level: 1,
      path: '/tmp/foo/a.txt',
      data: stringToUint8Array('A'),
    };
    const actual = await Effect.runPromise(
      unit.DefaultTreeCrawlerFileHandler(memFsTinyFileSystem, '/tmp/foo', 'a.txt', 1)
    );
    expect(actual).toStrictEqual(Option.some(expected));
  });
});
