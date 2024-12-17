import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/memfs';
import { Option } from 'effect';
import * as Effect from 'effect/Effect';
import { beforeAll, describe, expect, it } from 'vitest';

import memFs1Fixture from '../../test/fixtures/memfs-1.json' with { type: 'json' };
import * as unit from './noop-directory-handler.js';

describe('noop-directory-handler', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(unit.NoopTreeCrawlerDirectoryHandler(memFsTinyFileSystem, '/foo', 1)).toStrictEqual(
      Effect.succeed(Option.none())
    );
  });
});
