import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';
import * as Effect from 'effect/Effect';
import { beforeAll, describe, expect, it } from 'vitest';

import memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './glob-file-filter';

describe('glob-file-filter', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(
      Effect.runSync(unit.GlobFileFilter('/tmp/foo/a.txt')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))
    ).toStrictEqual(true);
    expect(
      Effect.runSync(unit.GlobFileFilter('/tmp/foo/*.txt')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))
    ).toStrictEqual(true);
    expect(
      Effect.runSync(unit.GlobFileFilter('/tmp/foo/*.*')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))
    ).toStrictEqual(true);
    expect(Effect.runSync(unit.GlobFileFilter('**/*')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))).toStrictEqual(
      true
    );
    expect(Effect.runSync(unit.GlobFileFilter('**')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))).toStrictEqual(
      true
    );
    expect(Effect.runSync(unit.GlobFileFilter('*')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))).toStrictEqual(
      false
    );
    expect(Effect.runSync(unit.GlobFileFilter('*.txt')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))).toStrictEqual(
      false
    );
    expect(
      Effect.runSync(unit.GlobFileFilter('**/*.csv')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))
    ).toStrictEqual(false);
  });
});
