/* eslint-disable fp/no-mutation,fp/no-let */
import * as P from '@konker.dev/effect-ts-prelude';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';

import * as memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './glob-file-filter';

describe('glob-file-filter', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(
      P.Effect.runSync(unit.GlobFileFilter('/tmp/foo/a.txt')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))
    ).toStrictEqual(true);
    expect(
      P.Effect.runSync(unit.GlobFileFilter('/tmp/foo/*.txt')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))
    ).toStrictEqual(true);
    expect(
      P.Effect.runSync(unit.GlobFileFilter('/tmp/foo/*.*')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))
    ).toStrictEqual(true);
    expect(P.Effect.runSync(unit.GlobFileFilter('**/*')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))).toStrictEqual(
      true
    );
    expect(P.Effect.runSync(unit.GlobFileFilter('**')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))).toStrictEqual(
      true
    );
    expect(P.Effect.runSync(unit.GlobFileFilter('*')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))).toStrictEqual(
      false
    );
    expect(
      P.Effect.runSync(unit.GlobFileFilter('*.txt')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))
    ).toStrictEqual(false);
    expect(
      P.Effect.runSync(unit.GlobFileFilter('**/*.csv')(memFsTinyFileSystem, '/tmp', 'foo', 'a.txt', 1))
    ).toStrictEqual(false);
  });
});
