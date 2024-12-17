import { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { MockMomentoClient, TEST_MOMENTO_AUTH_TOKEN } from '@konker.dev/momento-cache-client-effect/lib/test';
import { MomentoStringCacheJson } from '@konker.dev/tiny-cache-fp/momento/MomentoStringCacheJson';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as common from '../test/test-common.js';
import { TestDeps } from '../test/test-common.js';
import * as unit from './cacheMomento.js';

export type In = { foo: 'foo' };

const TEST_IN: In = { foo: 'foo' };

describe('middleware/cache-momento', () => {
  const cache = MomentoStringCacheJson();
  let TEST_DEPS: MomentoClientDeps;
  let oldEnv: any;

  beforeAll(() => {
    oldEnv = process.env;
    process.env = {
      MOMENTO_AUTH_TOKEN: TEST_MOMENTO_AUTH_TOKEN,
    };
  });
  beforeEach(() => {
    TEST_DEPS = {
      makeMomentoClient: () => Effect.succeed(MockMomentoClient()),
    };
  });
  afterAll(() => {
    process.env = oldEnv;
  });

  const cacheKeyResolver = <I>(_: I) => Effect.succeed('CACHE_KEY');
  const coreSpy = vi.spyOn(common, 'echoCoreInDeps');
  // const stack = unit.middleware(cacheKeyResolver, cache)(common.echoCoreIn);
  const stack = pipe(
    common.echoCoreInDeps(common.TestDeps),
    unit.middleware<In, common.TestDeps, any>(cacheKeyResolver, cache)
  );

  it('should work as expected', async () => {
    const result1 = await pipe(
      stack(TEST_IN),
      Effect.provideService(TestDeps, {}),
      Effect.provideService(MomentoClientDeps, TEST_DEPS),
      Effect.runPromise
    );
    const result2 = await pipe(
      stack(TEST_IN),
      Effect.provideService(TestDeps, {}),
      Effect.provideService(MomentoClientDeps, TEST_DEPS),
      Effect.runPromise
    );
    expect(result1).toStrictEqual({ foo: 'foo' });
    expect(result2).toStrictEqual(result1);
    expect(coreSpy).toHaveBeenCalledTimes(1);
  });
});
