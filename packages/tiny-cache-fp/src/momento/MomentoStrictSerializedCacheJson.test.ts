import type * as momento from '@gomomento/sdk';
import * as P from '@konker.dev/effect-ts-prelude';
import { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { MockMomentoClient, TEST_MOMENTO_AUTH_TOKEN } from '@konker.dev/momento-cache-client-effect/dist/lib/test';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import * as unit from './MomentoStrictSerializedCacheJson';

const TEST_KEY = 'test-key';
const TEST_VALUE = {
  foo: 'test-foo',
  bar: 42,
};

const TEST_SCHEMA = P.Schema.Struct({
  foo: P.Schema.String,
  bar: P.Schema.Number,
});

describe('MomentoStrictSerializedCacheJson', () => {
  const cache = unit.MomentoStrictSerializedCacheJson(TEST_SCHEMA);
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
      makeMomentoClient: () => P.Effect.succeed(momentoClient),
    });
  });
  afterAll(() => {
    process.env = oldEnv;
  });

  it('should be able to get a value which does not exist', async () => {
    const result = P.pipe(cache.getVal('non-existing-key'), P.Effect.provideService(MomentoClientDeps, deps));
    await expect(P.Effect.runPromise(result)).resolves.toStrictEqual(P.Option.none());
  });

  it('should be able to set and get a value', async () => {
    const result1 = P.pipe(cache.setVal(TEST_KEY, TEST_VALUE), P.Effect.provideService(MomentoClientDeps, deps));
    const result2 = P.pipe(cache.getVal(TEST_KEY), P.Effect.provideService(MomentoClientDeps, deps));
    await expect(P.Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE));
  });

  it('should _not_ be able to set an invalid value', async () => {
    const result1 = P.pipe(
      cache.setVal(TEST_KEY, 'INVALID VALUE' as any),
      P.Effect.provideService(MomentoClientDeps, deps)
    );
    await expect(P.Effect.runPromise(result1)).rejects.toThrow('INVALID VALUE');
  });

  it('should be able to set and delete a string value', async () => {
    const result1 = P.pipe(cache.setVal(TEST_KEY, TEST_VALUE), P.Effect.provideService(MomentoClientDeps, deps));
    const result2 = P.pipe(cache.getVal(TEST_KEY), P.Effect.provideService(MomentoClientDeps, deps));
    const result3 = P.pipe(cache.delVal(TEST_KEY), P.Effect.provideService(MomentoClientDeps, deps));
    const result4 = P.pipe(cache.getVal(TEST_KEY), P.Effect.provideService(MomentoClientDeps, deps));
    await expect(P.Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE));
    await expect(P.Effect.runPromise(result3)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result4)).resolves.toStrictEqual(P.Option.none());
  });

  //[FIXME: error cases]
});
