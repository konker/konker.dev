import * as P from '@konker.dev/effect-ts-prelude';

import { InMemoryCache } from './InMemoryCache';
import * as unit from './InMemoryStrictSerializedCache';

const TEST_KEY = 'test-key';
const TEST_VALUE = {
  foo: 'test-foo',
  bar: 42,
};

const TEST_SCHEMA = P.Schema.Struct({
  foo: P.Schema.String,
  bar: P.Schema.Number,
});
type TestSchema = P.Schema.Schema.Type<typeof TEST_SCHEMA>;

describe('InMemoryStrictSerializedCache', () => {
  const cache: unit.InMemoryStrictSerializedCache<TestSchema> = unit.InMemoryStrictSerializedCache(
    InMemoryCache<TestSchema>(),
    TEST_SCHEMA
  );

  it('should be able to get a value which does not exist', async () => {
    const result1 = cache.getVal('non-existing-key');
    await expect(P.Effect.runPromise(result1)).resolves.toStrictEqual(P.Option.none());
  });

  it('should be able to set and get a value', async () => {
    const result1 = cache.setVal(TEST_KEY, TEST_VALUE);
    const result2 = cache.getVal(TEST_KEY);
    await expect(P.Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE));
  });

  it('should _not_ be able to set an invalid value', async () => {
    const result1 = cache.setVal(TEST_KEY, 'INVALID VALUE' as any);
    await expect(P.Effect.runPromise(result1)).rejects.toThrow('INVALID VALUE');
  });

  it('should be able to set and delete a string value', async () => {
    const result1 = cache.setVal(TEST_KEY, TEST_VALUE);
    const result2 = cache.getVal(TEST_KEY);
    const result3 = cache.delVal(TEST_KEY);
    const result4 = cache.getVal(TEST_KEY);
    await expect(P.Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE));
    await expect(P.Effect.runPromise(result3)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result4)).resolves.toStrictEqual(P.Option.none());
  });
});
