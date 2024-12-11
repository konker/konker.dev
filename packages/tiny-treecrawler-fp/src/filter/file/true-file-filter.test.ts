import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';
import * as Effect from 'effect/Effect';
import { beforeAll, describe, expect, it } from 'vitest';

import memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './true-file-filter';

describe('true-directory-filter', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(unit.TrueFileFilter(memFsTinyFileSystem, '/', 'foo', 'a.txt', 1)).toStrictEqual(Effect.succeed(true));
  });
});
