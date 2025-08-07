import type * as momento from '@gomomento/sdk';
import { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { MockMomentoClient, TEST_MOMENTO_AUTH_TOKEN } from '@konker.dev/momento-cache-client-effect/lib/test';
import { Option, pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { StrictSerializedCache } from '../StrictSerializedCache.js';
import { MomentoStringCache } from './MomentoStringCache.js';

const TEST_KEY = 'test-key';
const TEST_VALUE = {
  foo: 'test-foo',
  bar: 42,
};

const TEST_SCHEMA = Schema.Struct({
  foo: Schema.String,
  bar: Schema.Number,
});

const TEST_SCHEMA_STRING = Schema.parseJson(TEST_SCHEMA);
type TestSchemaString = Schema.Schema.Type<typeof TEST_SCHEMA_STRING>;

describe('MomentoStrictSerializedCache', () => {
  const cache: StrictSerializedCache<TestSchemaString, MomentoClientDeps> = StrictSerializedCache(
    MomentoStringCache,
    TEST_SCHEMA_STRING
  );

  let momentoClient: momento.CacheClient;
  let deps: MomentoClientDeps;
  let oldEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    oldEnv = process.env;
    process.env = {
      MOMENTO_AUTH_TOKEN: TEST_MOMENTO_AUTH_TOKEN,
    };
  });
  beforeEach(() => {
    momentoClient = MockMomentoClient();
    deps = MomentoClientDeps.of({
      makeMomentoClient: () => Effect.succeed(momentoClient),
    });
  });
  afterAll(() => {
    process.env = oldEnv;
  });

  it('should be able to get a value which does not exist', async () => {
    const result1 = pipe(cache.getVal('non-existing-key'), Effect.provideService(MomentoClientDeps, deps));
    await expect(Effect.runPromise(result1)).resolves.toStrictEqual(Option.none());
  });

  it('should be able to set and get a value', async () => {
    const result1 = pipe(cache.setVal(TEST_KEY, TEST_VALUE), Effect.provideService(MomentoClientDeps, deps));
    const result2 = pipe(cache.getVal(TEST_KEY), Effect.provideService(MomentoClientDeps, deps));
    await expect(Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(Effect.runPromise(result2)).resolves.toStrictEqual(Option.some(TEST_VALUE));
  });

  it('should _not_ be able to set an invalid value', async () => {
    const result1 = pipe(
      cache.setVal(TEST_KEY, 'INVALID VALUE' as any),
      Effect.provideService(MomentoClientDeps, deps)
    );
    await expect(Effect.runPromise(result1)).rejects.toThrow('INVALID VALUE');
  });

  it('should be able to set and delete a string value', async () => {
    const result1 = pipe(cache.setVal(TEST_KEY, TEST_VALUE), Effect.provideService(MomentoClientDeps, deps));
    const result2 = pipe(cache.getVal(TEST_KEY), Effect.provideService(MomentoClientDeps, deps));
    const result3 = pipe(cache.delVal(TEST_KEY), Effect.provideService(MomentoClientDeps, deps));
    const result4 = pipe(cache.getVal(TEST_KEY), Effect.provideService(MomentoClientDeps, deps));
    await expect(Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(Effect.runPromise(result2)).resolves.toStrictEqual(Option.some(TEST_VALUE));
    await expect(Effect.runPromise(result3)).resolves.not.toThrow();
    await expect(Effect.runPromise(result4)).resolves.toStrictEqual(Option.none());
  });

  //[FIXME: error cases]
});
