import * as P from '@konker.dev/effect-ts-prelude';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Cache } from '../Cache';
import { InMemoryCache } from '../memory/InMemoryCache';
import * as unit from './helpers';

const TEST_KEY = 'test-key-1';
const TEST_VALUE = 'test-value';

describe('helpers', () => {
  describe('chainGetValue', () => {
    let cache: Cache<string, never>;

    beforeEach(() => {
      cache = InMemoryCache();
    });

    it('should work as expected', async () => {
      await P.Effect.runPromise(cache.setVal(TEST_KEY, TEST_VALUE));
      const actual1 = unit.chainGetVal(cache)(TEST_KEY);
      const actual2 = unit.chainGetVal(cache)('DOES_NOT_EXIST_KEY');

      await expect(P.Effect.runPromise(actual1)).resolves.toStrictEqual(TEST_VALUE);
      await expect(P.Effect.runPromise(actual2)).rejects.toThrow();
    });
  });

  describe('chainSetValue', () => {
    let cache: Cache<string, never>;

    beforeEach(() => {
      cache = InMemoryCache();
    });

    it('should work as expected', async () => {
      const actual = unit.chainSetVal(cache, TEST_KEY, TEST_VALUE);

      await expect(P.Effect.runPromise(actual)).resolves.toStrictEqual(TEST_VALUE);
    });
  });
});
