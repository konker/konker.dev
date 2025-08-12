import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it, vi } from 'vitest';

import * as common from '../../test/test-common.js';
import { TestDepsW } from '../../test/test-common.js';
import { EMPTY_REQUEST_W } from '../request.js';
import * as unit from './cacheInMemory.js';

const TEST_DEPS: TestDepsW = { bar: 'bar' };

describe('middleware/cache-in-memory', () => {
  const cacheKeyResolver = <I>(_: I) => Effect.succeed('CACHE_KEY');
  const coreSpy = vi.spyOn(common, 'echoCoreInDepsW');
  const stack = pipe(common.echoCoreInDepsW(TestDepsW), unit.middleware<{}, common.TestDepsW>(cacheKeyResolver));

  it('should work as expected', async () => {
    const result1 = await pipe(stack(EMPTY_REQUEST_W), Effect.provideService(TestDepsW, TEST_DEPS), Effect.runPromise);
    const result2 = await pipe(stack(EMPTY_REQUEST_W), Effect.provideService(TestDepsW, TEST_DEPS), Effect.runPromise);
    expect(result1).toStrictEqual({
      body: 'OK',
      deps: {
        bar: 'bar',
      },
      headers: {},
      in: {
        headers: {},
        method: 'GET',
        pathParameters: {},
        queryStringParameters: {},
      },
      statusCode: 200,
    });
    expect(result2).toStrictEqual(result1);
    expect(coreSpy).toHaveBeenCalledTimes(1);
  });
});
