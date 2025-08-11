import { TEST_JWT_NOW_MS } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/jwt';
import { TEST_TOKEN } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/test-jwt-tokens';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { echoCoreIn200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../request.js';
import * as unit from './jwtDecoder.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

const VALID_JWT_VALUE = `Bearer ${TEST_TOKEN}`;
const INVALID_JWT_VALUE = 'Bearer Banana';

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, {
  headers: {
    authorization: VALID_JWT_VALUE,
  },
  headersNormalizerRequestRaw: {
    Authorization: VALID_JWT_VALUE,
  },
  body: {},
});

const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, {
  headers: {
    authorization: INVALID_JWT_VALUE,
  },
  headersNormalizerRequestRaw: {
    Authorization: INVALID_JWT_VALUE,
  },
});

describe('middleware/jwt-decoder', () => {
  let errorSpy: MockInstance;

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);
    vi.spyOn(Effect, 'logDebug').mockReturnValue(Effect.succeed(undefined));
    errorSpy = vi.spyOn(Effect, 'logError').mockReturnValue(Effect.succeed(undefined));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work as expected in an success case', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = await pipe(egHandler(TEST_IN_1), Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 200,
      body: {},
      headers: {
        authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4LCJpc3MiOiJ0ZXN0LWlzcyJ9.IfZ_IlbKl2S7pkKBqTis0kyBmDuXGbBkCdCkrDdLq_Q',
      },
      in: {
        method: 'GET',
        body: {},
        pathParameters: {},
        queryStringParameters: {},
        headers: {
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4LCJpc3MiOiJ0ZXN0LWlzcyJ9.IfZ_IlbKl2S7pkKBqTis0kyBmDuXGbBkCdCkrDdLq_Q',
        },
        headersNormalizerRequestRaw: {
          Authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4LCJpc3MiOiJ0ZXN0LWlzcyJ9.IfZ_IlbKl2S7pkKBqTis0kyBmDuXGbBkCdCkrDdLq_Q',
        },
        userId: 'test-sub',
      },
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an error case', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);

    await expect(result).rejects.toThrow('Invalid JWT credentials');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
