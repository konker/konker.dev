import * as Effect from 'effect/Effect';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Cache } from '../Cache.js';
import { InMemoryCache } from '../memory/InMemoryCache.js';
import * as unit from './helpers.js';

const TEST_KEY = 'test-key-1';
const TEST_VALUE = 'test-value';

describe('helpers', () => {
  describe('chainGetValue', () => {
    let cache: Cache<string, never>;

    beforeEach(() => {
      cache = InMemoryCache();
    });

    it('should work as expected', async () => {
      await Effect.runPromise(cache.setVal(TEST_KEY, TEST_VALUE));
      const actual1 = unit.chainGetVal(cache)(TEST_KEY);
      const actual2 = unit.chainGetVal(cache)('DOES_NOT_EXIST_KEY');

      await expect(Effect.runPromise(actual1)).resolves.toStrictEqual(TEST_VALUE);
      await expect(Effect.runPromise(actual2)).rejects.toThrow();
    });
  });

  describe('chainSetValue', () => {
    let cache: Cache<string, never>;

    beforeEach(() => {
      cache = InMemoryCache();
    });

    it('should work as expected', async () => {
      const actual = unit.chainSetVal(cache, TEST_KEY, TEST_VALUE);

      await expect(Effect.runPromise(actual)).resolves.toStrictEqual(TEST_VALUE);
    });
  });
});
