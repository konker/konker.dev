import * as P from '@konker.dev/effect-ts-prelude';

import { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { MockMomentoClient, TEST_MOMENTO_AUTH_TOKEN } from '@konker.dev/momento-cache-client-effect/dist/lib/test';
import { MomentoStringCacheJson } from '@konker.dev/tiny-cache-fp/dist/momento/MomentoStringCacheJson';

import * as common from '../test/test-common';
import { TestDeps } from '../test/test-common';
import * as unit from './cacheMomento';

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
      makeMomentoClient: () => P.Effect.succeed(MockMomentoClient()),
    };
  });
  afterAll(() => {
    process.env = oldEnv;
  });

  const cacheKeyResolver = <I>(_: I) => P.Effect.succeed('CACHE_KEY');
  const coreSpy = jest.spyOn(common, 'echoCoreInDeps');
  // const stack = unit.middleware(cacheKeyResolver, cache)(common.echoCoreIn);
  const stack = P.pipe(
    common.echoCoreInDeps(common.TestDeps),
    unit.middleware<In, common.TestDeps, any>(cacheKeyResolver, cache)
  );

  test('it should work as expected', async () => {
    const result1 = await P.pipe(
      stack(TEST_IN),
      P.Effect.provideService(TestDeps, {}),
      P.Effect.provideService(MomentoClientDeps, TEST_DEPS),
      P.Effect.runPromise
    );
    const result2 = await P.pipe(
      stack(TEST_IN),
      P.Effect.provideService(TestDeps, {}),
      P.Effect.provideService(MomentoClientDeps, TEST_DEPS),
      P.Effect.runPromise
    );
    expect(result1).toStrictEqual({ foo: 'foo' });
    expect(result2).toStrictEqual(result1);
    expect(coreSpy).toHaveBeenCalledTimes(1);
  });
});
