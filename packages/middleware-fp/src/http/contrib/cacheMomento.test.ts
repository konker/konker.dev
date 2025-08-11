import { mockMomentoClientDeps, TEST_MOMENTO_AUTH_TOKEN } from '@konker.dev/momento-cache-client-effect/lib/test';
import { JsonCache } from '@konker.dev/tiny-cache-fp/JsonCache';
import { MomentoStringCache } from '@konker.dev/tiny-cache-fp/momento/MomentoStringCache';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestDepsW } from '../../test/test-common.js';
import { EMPTY_REQUEST_W } from '../request.js';
import { makeResponseW } from '../response.js';
import * as unit from './cacheMomento.js';

describe('middleware/cache-momento', () => {
  const cache = JsonCache(MomentoStringCache);
  const __cache = {};

  let oldEnv: any;

  beforeAll(() => {
    oldEnv = process.env;
    process.env = {
      MOMENTO_AUTH_TOKEN: TEST_MOMENTO_AUTH_TOKEN,
    };
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterAll(() => {
    process.env = oldEnv;
  });

  const cacheKeyResolver = <I>(_: I) => Effect.succeed('CACHE_KEY');
  const coreDummy = vi.fn().mockImplementation((i) =>
    Effect.succeed(
      makeResponseW(
        {
          statusCode: 200,
          headers: {
            ...i.headers,
          },
          body: i.body ?? 'OK',
        },
        { in: i }
      )
    )
  );

  const stack = pipe(coreDummy, unit.middleware<{}, TestDepsW, any>(cacheKeyResolver, cache));

  it('should work as expected', async () => {
    const result1 = await pipe(
      stack(EMPTY_REQUEST_W),
      Effect.provideService(TestDepsW, {}),
      mockMomentoClientDeps(__cache),
      Effect.runPromise
    );
    const result2 = await pipe(
      stack(EMPTY_REQUEST_W),
      Effect.provideService(TestDepsW, {}),
      mockMomentoClientDeps(__cache),
      Effect.runPromise
    );
    expect(result1).toStrictEqual({
      body: 'OK',
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
    expect(coreDummy).toHaveBeenCalledTimes(1);
  });
});
