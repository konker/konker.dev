import * as P from '@konker.dev/effect-ts-prelude';

import * as common from '../test/test-common';
import { TestDeps } from '../test/test-common';
import * as unit from './cacheInMemory';

export type In = { foo: 'foo' };

const TEST_IN: In = { foo: 'foo' };
const TEST_DEPS: common.TestDeps = { bar: 'bar' };

describe('middleware/cache-in-memory', () => {
  const cacheKeyResolver = <I>(_: I) => P.Effect.succeed('CACHE_KEY');
  const coreSpy = jest.spyOn(common, 'echoCoreInDeps');
  const stack = P.pipe(common.echoCoreInDeps(common.TestDeps), unit.middleware<In, common.TestDeps>(cacheKeyResolver));

  test('it should work as expected', async () => {
    const result1 = await P.pipe(stack(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    const result2 = await P.pipe(stack(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    expect(result1).toStrictEqual({ foo: 'foo', bar: 'bar' });
    expect(result2).toStrictEqual(result1);
    expect(coreSpy).toHaveBeenCalledTimes(1);
  });
});
