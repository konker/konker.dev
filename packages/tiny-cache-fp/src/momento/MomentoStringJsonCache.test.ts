import type * as momento from '@gomomento/sdk';
import { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { MockMomentoClient, TEST_MOMENTO_AUTH_TOKEN } from '@konker.dev/momento-cache-client-effect/lib/test';
import { Option, pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { JsonCache } from '../JsonCache.js';
import { MomentoStringCache } from './MomentoStringCache.js';

const TEST_KEY_1 = 'test-key-1';
const TEST_VALUE_1 = 'test-value';

describe('MomentoStringCacheJson', () => {
  const cache: JsonCache<MomentoClientDeps> = JsonCache(MomentoStringCache);

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

  it('should be able to set and get a string value', async () => {
    const result1 = pipe(cache.setVal(TEST_KEY_1, TEST_VALUE_1), Effect.provideService(MomentoClientDeps, deps));
    const result2 = pipe(cache.getVal(TEST_KEY_1), Effect.provideService(MomentoClientDeps, deps));
    await expect(Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(Effect.runPromise(result2)).resolves.toStrictEqual(Option.some(TEST_VALUE_1));
  });

  it('should be able to set and delete a string value', async () => {
    const result1 = pipe(cache.setVal(TEST_KEY_1, TEST_VALUE_1), Effect.provideService(MomentoClientDeps, deps));
    const result2 = pipe(cache.getVal(TEST_KEY_1), Effect.provideService(MomentoClientDeps, deps));
    const result3 = pipe(cache.delVal(TEST_KEY_1), Effect.provideService(MomentoClientDeps, deps));
    const result4 = pipe(cache.getVal(TEST_KEY_1), Effect.provideService(MomentoClientDeps, deps));
    await expect(Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(Effect.runPromise(result2)).resolves.toStrictEqual(Option.some(TEST_VALUE_1));
    await expect(Effect.runPromise(result3)).resolves.not.toThrow();
    await expect(Effect.runPromise(result4)).resolves.toStrictEqual(Option.none());
  });

  //[FIXME: error cases]
});
