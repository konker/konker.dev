import * as P from '@konker.dev/effect-ts-prelude';
import { MemFsTinyFileSystem } from '@konker.dev/tiny-filesystem-fp/dist/memfs';
import { beforeAll, describe, expect, it } from 'vitest';

import memFs1Fixture from '../../test/fixtures/memfs-1.json';
import * as unit from './noop-directory-handler';

describe('noop-directory-handler', () => {
  let memFsTinyFileSystem: MemFsTinyFileSystem;

  beforeAll(() => {
    memFsTinyFileSystem = MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  it('should work as expected', () => {
    expect(unit.NoopTreeCrawlerDirectoryHandler(memFsTinyFileSystem, '/foo', 1)).toStrictEqual(
      P.Effect.succeed(P.Option.none())
    );
  });
});
