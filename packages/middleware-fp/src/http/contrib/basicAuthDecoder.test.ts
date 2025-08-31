import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { echoCoreIn200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../request.js';
import * as unit from './basicAuthDecoder.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

// user0:secret-0
const VALID_BASIC_AUTH_VALUE = 'Basic dXNlcjA6c2VjcmV0LTA=';

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, {
  headers: {
    authorization: VALID_BASIC_AUTH_VALUE,
  },
  headersNormalizerRequestRaw: {
    Authorization: VALID_BASIC_AUTH_VALUE,
  },
  body: {},
});

const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, {
  headers: {},
  headersNormalizerRequestRaw: {},
  body: {},
});

describe('middleware/basic-auth-decoder', () => {
  beforeEach(() => {
    vi.spyOn(Effect, 'logDebug').mockReturnValue(Effect.succeed(undefined));
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
        authorization: VALID_BASIC_AUTH_VALUE,
      },
      in: {
        url: '/',
        method: 'GET',
        body: {},
        headers: {
          authorization: VALID_BASIC_AUTH_VALUE,
        },
        headersNormalizerRequestRaw: {
          Authorization: VALID_BASIC_AUTH_VALUE,
        },
        pathParameters: {},
        queryStringParameters: {},
        userId: 'user0',
      },
    });
  });

  it('should work as expected in an error case', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);

    await expect(result).rejects.toThrow('No token found');
  });
});
