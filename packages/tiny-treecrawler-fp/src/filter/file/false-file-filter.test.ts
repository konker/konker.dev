/* eslint-disable fp/no-mutation,fp/no-let */
import * as P from '@konker.dev/effect-ts-prelude';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';

import * as memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './false-file-filter';

describe('false-directory-filter', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(unit.FalseFileFilter(memFsTinyFileSystem, '/', 'foo', 'a.txt', 1)).toStrictEqual(P.Effect.succeed(false));
  });
});
