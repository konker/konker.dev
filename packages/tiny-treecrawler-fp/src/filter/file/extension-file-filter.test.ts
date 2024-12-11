import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';
import * as Effect from 'effect/Effect';
import { beforeAll, describe, expect, it } from 'vitest';

import memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './extension-file-filter';

describe('extension-file-filter', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(unit.ExtensionFileFilter(['.txt'])(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1)).toStrictEqual(
      Effect.succeed(true)
    );
    expect(unit.ExtensionFileFilter(['.csv'])(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1)).toStrictEqual(
      Effect.succeed(false)
    );
    expect(unit.ExtensionFileFilter([])(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1)).toStrictEqual(
      Effect.succeed(false)
    );
  });
});
