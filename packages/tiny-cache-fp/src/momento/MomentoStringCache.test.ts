import * as P from '@konker.dev/effect-ts-prelude';

import type * as momento from '@gomomento/sdk';
import { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { MockMomentoClient, TEST_MOMENTO_AUTH_TOKEN } from '@konker.dev/momento-cache-client-effect/dist/lib/test';

import * as unit from './MomentoStringCache';

const TEST_KEY_1 = 'test-key-1';
const TEST_VALUE_1 = 'test-value';

describe('MomentoStringCache', () => {
  const cache = unit.MomentoStringCache;
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
    const result1 = P.pipe(cache.getVal('non-existing-key'), P.Effect.provideService(MomentoClientDeps, deps));
    await expect(P.Effect.runPromise(result1)).resolves.toStrictEqual(P.Option.none());
  });

  it('should be able to set and get a string value', async () => {
    const result1 = P.pipe(cache.setVal(TEST_KEY_1, TEST_VALUE_1), P.Effect.provideService(MomentoClientDeps, deps));
    const result2 = P.pipe(cache.getVal(TEST_KEY_1), P.Effect.provideService(MomentoClientDeps, deps));
    await expect(P.Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE_1));
  });

  it('should be able to set and delete a string value', async () => {
    const result1 = P.pipe(cache.setVal(TEST_KEY_1, TEST_VALUE_1), P.Effect.provideService(MomentoClientDeps, deps));
    const result2 = P.pipe(cache.getVal(TEST_KEY_1), P.Effect.provideService(MomentoClientDeps, deps));
    const result3 = P.pipe(cache.delVal(TEST_KEY_1), P.Effect.provideService(MomentoClientDeps, deps));
    const result4 = P.pipe(cache.getVal(TEST_KEY_1), P.Effect.provideService(MomentoClientDeps, deps));
    await expect(P.Effect.runPromise(result1)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result2)).resolves.toStrictEqual(P.Option.some(TEST_VALUE_1));
    await expect(P.Effect.runPromise(result3)).resolves.not.toThrow();
    await expect(P.Effect.runPromise(result4)).resolves.toStrictEqual(P.Option.none());
  });

  //[FIXME: error cases]
});
