/* eslint-disable fp/no-mutation,fp/no-let */
import * as P from '@konker.dev/effect-ts-prelude';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';

import * as memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './glob-directory-filter';

describe('glob-directory-filter', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(
      P.Effect.runSync(unit.GlobDirectoryFilter('/tmp/foo')(memFsTinyFileSystem, '/tmp', 'foo', 'foo', 1))
    ).toStrictEqual(true);
    expect(
      P.Effect.runSync(unit.GlobDirectoryFilter('/tmp/*')(memFsTinyFileSystem, '/tmp', 'foo', 'foo', 1))
    ).toStrictEqual(true);
    expect(
      P.Effect.runSync(unit.GlobDirectoryFilter('**/*')(memFsTinyFileSystem, '/tmp', 'foo', 'foo', 1))
    ).toStrictEqual(true);
    expect(
      P.Effect.runSync(unit.GlobDirectoryFilter('**')(memFsTinyFileSystem, '/tmp', 'foo', 'foo', 1))
    ).toStrictEqual(true);
    expect(P.Effect.runSync(unit.GlobDirectoryFilter('*')(memFsTinyFileSystem, '/tmp', 'foo', 'foo', 1))).toStrictEqual(
      false
    );
    expect(
      P.Effect.runSync(unit.GlobDirectoryFilter('foo')(memFsTinyFileSystem, '/tmp', 'foo', 'foo', 1))
    ).toStrictEqual(false);
    expect(
      P.Effect.runSync(unit.GlobDirectoryFilter('**/bar')(memFsTinyFileSystem, '/tmp', 'foo', 'foo', 1))
    ).toStrictEqual(false);
  });
});
