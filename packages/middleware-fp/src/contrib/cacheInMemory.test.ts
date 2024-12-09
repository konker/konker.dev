import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it, vi } from 'vitest';

import * as common from '../test/test-common';
import { TestDeps } from '../test/test-common';
import * as unit from './cacheInMemory';

export type In = { foo: 'foo' };

const TEST_IN: In = { foo: 'foo' };
const TEST_DEPS: common.TestDeps = { bar: 'bar' };

describe('middleware/cache-in-memory', () => {
  const cacheKeyResolver = <I>(_: I) => Effect.succeed('CACHE_KEY');
  const coreSpy = vi.spyOn(common, 'echoCoreInDeps');
  const stack = pipe(common.echoCoreInDeps(common.TestDeps), unit.middleware<In, common.TestDeps>(cacheKeyResolver));

  it('should work as expected', async () => {
    const result1 = await pipe(stack(TEST_IN), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    const result2 = await pipe(stack(TEST_IN), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    expect(result1).toStrictEqual({ foo: 'foo', bar: 'bar' });
    expect(result2).toStrictEqual(result1);
    expect(coreSpy).toHaveBeenCalledTimes(1);
  });
});
