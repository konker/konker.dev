import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/memfs';
import * as Effect from 'effect/Effect';
import { beforeAll, describe, expect, it } from 'vitest';

import memFs1Fixture from '../../test/fixtures/memfs-1.json' with { type: 'json' };
import * as unit from './false-directory-filter.js';

describe('false-directory-filter', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(unit.FalseDirectoryFilter(memFsTinyFileSystem, '/tmp', 'foo', 'foo', 2)).toStrictEqual(
      Effect.succeed(false)
    );
  });
});
