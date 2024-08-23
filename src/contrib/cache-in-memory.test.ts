import * as P from '@konker.dev/effect-ts-prelude';

import { InMemoryCache } from '@konker.dev/tiny-cache-fp/dist/memory/InMemoryCache';

import * as common from '../test/test-common';
import { Deps } from '../test/test-common';
import * as unit from './cache-in-memory';

export type In = { foo: 'foo' };

const TEST_IN: In = { foo: 'foo' };
const TEST_DEPS: common.Deps = { bar: 'bar' };

describe('middleware/cache-in-memory', () => {
  const cacheKeyResolver = <I>(_: I) => P.Effect.succeed('CACHE_KEY');
  const coreSpy = jest.spyOn(common, 'echoCoreInDeps');
  const stack = P.pipe(
    common.echoCoreInDeps(common.Deps),
    unit.middleware<In, common.Deps, any>(cacheKeyResolver, InMemoryCache())
  );

  test('it should work as expected', async () => {
    const result1 = await P.pipe(stack(TEST_IN), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    const result2 = await P.pipe(stack(TEST_IN), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    expect(result1).toStrictEqual({ foo: 'foo', bar: 'bar' });
    expect(result2).toStrictEqual(result1);
    expect(coreSpy).toHaveBeenCalledTimes(1);
  });
});
