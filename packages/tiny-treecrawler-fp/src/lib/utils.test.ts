import * as P from '@konker.dev/effect-ts-prelude';
import type { Ref } from '@konker.dev/tiny-filesystem-fp';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';
import { beforeAll, describe, expect, it } from 'vitest';

import { TreeCrawlerDataType } from '../index';
import memFs1Fixture from '../test/fixtures/memfs-1.json';
import * as unit from './utils';

describe('utils', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  describe('isFileData', () => {
    it('should work as expected', () => {
      expect(
        unit.isFileData({ _tag: TreeCrawlerDataType.File, level: 0, path: '/tmp/foo', data: new Uint8Array() })
      ).toStrictEqual(true);
      expect(
        unit.isFileData({ _tag: TreeCrawlerDataType.Directory, level: 0, path: '/tmp/foo', data: [] })
      ).toStrictEqual(false);
    });
  });

  describe('isDirectoryData', () => {
    it('should work as expected', () => {
      expect(
        unit.isDirectoryData({ _tag: TreeCrawlerDataType.File, level: 0, path: '/tmp/foo', data: new Uint8Array() })
      ).toStrictEqual(false);
      expect(
        unit.isDirectoryData({ _tag: TreeCrawlerDataType.Directory, level: 0, path: '/tmp/foo', data: [] })
      ).toStrictEqual(true);
    });
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
