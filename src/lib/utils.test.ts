/* eslint-disable fp/no-mutation,fp/no-let */
import * as P from '@konker.dev/effect-ts-prelude';
import type { Ref } from '@konker.dev/tiny-filesystem-fp';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';

import * as memFs1Fixture from '../test/fixtures/memfs-1.json';
import * as unit from './utils';

describe('utils', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  describe('sortListingByFileType', () => {
    it('should sort a listing by file type, directory first', async () => {
      const listing = ['/tmp/foo/a.txt', '/tmp/foo', '/tmp/foo/b.txt'] as Array<Ref>;
      const actual = await P.Effect.runPromise(unit.sortListingByFileType(memFsTinyFileSystem, true)(listing));
      const expected = [
        { childPath: '/tmp/foo', fileType: 'Directory' },
        { childPath: '/tmp/foo/a.txt', fileType: 'File' },
        { childPath: '/tmp/foo/b.txt', fileType: 'File' },
      ];
      expect(actual).toStrictEqual(expected);
    });

    it('should sort a listing by file type, files first', async () => {
      const listing = ['/tmp/foo/a.txt', '/tmp/foo', '/tmp/foo/b.txt'] as Array<Ref>;
      const actual = await P.Effect.runPromise(unit.sortListingByFileType(memFsTinyFileSystem, false)(listing));
      const expected = [
        { childPath: '/tmp/foo/a.txt', fileType: 'File' },
        { childPath: '/tmp/foo/b.txt', fileType: 'File' },
        { childPath: '/tmp/foo', fileType: 'Directory' },
      ];
      expect(actual).toStrictEqual(expected);
    });
  });
});
