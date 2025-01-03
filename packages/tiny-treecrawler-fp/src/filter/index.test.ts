import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/memfs';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { beforeAll, describe, expect, it } from 'vitest';

import memFs1Fixture from '../test/fixtures/memfs-1.json' with { type: 'json' };
import { FalseDirectoryFilter } from './directory/false-directory-filter.js';
import { TrueDirectoryFilter } from './directory/true-directory-filter.js';
import { ExtensionFileFilter } from './file/extension-file-filter.js';
import { FalseFileFilter } from './file/false-file-filter.js';
import { TrueFileFilter } from './file/true-file-filter.js';
import * as unit from './index.js';

describe('filter', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  describe('sequenceFileFilters', () => {
    it('should work as expected', async () => {
      const actual = await Effect.runPromise(
        pipe([ExtensionFileFilter(['.txt']), TrueFileFilter], unit.sequenceFileFilters)(
          memFsTinyFileSystem,
          '/',
          'foo',
          'a.txt',
          1
        )
      );
      expect(actual).toStrictEqual(true);
    });

    it('should work as expected', async () => {
      const actual = await Effect.runPromise(
        pipe([ExtensionFileFilter(['.txt']), FalseFileFilter], unit.sequenceFileFilters)(
          memFsTinyFileSystem,
          '/',
          'foo',
          'a.csv',
          1
        )
      );
      expect(actual).toStrictEqual(false);
    });

    it('should work as expected', async () => {
      const actual = await Effect.runPromise(
        pipe([FalseFileFilter, FalseFileFilter], unit.sequenceFileFilters)(memFsTinyFileSystem, '/', 'foo', 'a.json', 1)
      );
      expect(actual).toStrictEqual(false);
    });
  });

  describe('sequenceDirectoryFilters', () => {
    it('should work as expected', async () => {
      const actual = await Effect.runPromise(
        pipe(
          unit.sequenceDirectoryFilters([TrueDirectoryFilter, FalseDirectoryFilter])(
            memFsTinyFileSystem,
            '/',
            'foo',
            'foo',
            1
          )
        )
      );
      expect(actual).toStrictEqual(false);
    });

    it('should work as expected', async () => {
      const actual = await Effect.runPromise(
        pipe(
          unit.sequenceDirectoryFilters([TrueDirectoryFilter, TrueDirectoryFilter])(
            memFsTinyFileSystem,
            '/',
            'foo',
            'foo',
            1
          )
        )
      );
      expect(actual).toStrictEqual(true);
    });
  });
});
