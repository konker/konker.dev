import * as P from '@konker.dev/effect-ts-prelude';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';
import { beforeAll, describe, expect, it } from 'vitest';

import memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './false-directory-filter';

describe('false-directory-filter', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(unit.FalseDirectoryFilter(memFsTinyFileSystem, '/tmp', 'foo', 'foo', 2)).toStrictEqual(
      P.Effect.succeed(false)
    );
  });
});
