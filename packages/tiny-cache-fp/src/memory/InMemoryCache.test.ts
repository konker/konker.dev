import * as P from '@konker.dev/effect-ts-prelude';
import { describe, expect, it } from 'vitest';

import * as unit from './InMemoryCache';

const TEST_KEY_1 = 'test-key-1';
const TEST_VALUE_1 = 'test-value';
const TEST_KEY_2 = 'test-key-2';
const TEST_VALUE_2 = {
  foo: 'test-foo',
  bar: 42,
};

describe('InMemoryCache', () => {
  const cache = unit.InMemoryCache();

  it('should be able to get a value which does not exist', async () => {
    const result1 = cache.getVal('non-existing-key');
    await expect(P.Effect.runPromise(result1)).resolves.toStrictEqual(P.Option.none());
  });

  it('should be able to set and get a string value', async () => {
    const result1 = cache.setVal(TEST_KEY_1, TEST_VALUE_1);
    const result2 = cache.getVal(TEST_KEY_1);
    await expect(P.Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE_1));
  });

  it('should be able to set and get an object value', async () => {
    const result1 = cache.setVal(TEST_KEY_2, TEST_VALUE_2);
    const result2 = cache.getVal(TEST_KEY_2);
    await expect(P.Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE_2));
  });

  it('should be able to set and delete a string value', async () => {
    const result1 = cache.setVal(TEST_KEY_1, TEST_VALUE_1);
    const result2 = cache.getVal(TEST_KEY_1);
    const result3 = cache.delVal(TEST_KEY_1);
    const result4 = cache.getVal(TEST_KEY_1);
    await expect(P.Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE_1));
    await expect(P.Effect.runPromise(result3)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result4)).resolves.toStrictEqual(P.Option.none());
  });
});
