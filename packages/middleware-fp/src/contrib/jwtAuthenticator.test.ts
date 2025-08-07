import type { JwtVerificationConfig } from '@konker.dev/tiny-auth-utils-fp/jwt';
import {
  TEST_JWT_ISS,
  TEST_JWT_NOW_MS,
  TEST_JWT_SIGNING_SECRET,
} from '@konker.dev/tiny-auth-utils-fp/test/fixtures/jwt';
import { TEST_TOKEN } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/test-jwt-tokens';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { EMPTY_REQUEST_W, makeRequestW } from '../lib/http.js';
import { echoCoreIn200W } from '../test/test-common.js';
import * as unit from './jwtAuthenticator.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

export const JWT_AUTHENTICATOR_TEST_DEPS: JwtVerificationConfig = unit.JwtAuthenticatorDeps.of({
  signingSecret: TEST_JWT_SIGNING_SECRET,
  issuer: TEST_JWT_ISS,
});

export const mockJwtAuthenticatorDeps = Effect.provideService(unit.JwtAuthenticatorDeps, JWT_AUTHENTICATOR_TEST_DEPS);

const VALID_JWT_VALUE = `Bearer ${TEST_TOKEN}`;
const INVALID_JWT_VALUE = 'Bearer Banana';

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, {
  headers: {
    authorization: VALID_JWT_VALUE,
  },
  headersNormalizerRequestRaw: {
    Authorization: VALID_JWT_VALUE,
  },
});

const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, {
  headers: {
    authorization: INVALID_JWT_VALUE,
  },
  headersNormalizerRequestRaw: {
    authorization: INVALID_JWT_VALUE,
  },
});

describe('middleware/jwt-authenticator', () => {
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
    const result = await pipe(egHandler(TEST_IN_1), mockJwtAuthenticatorDeps, Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: {
        authorization: VALID_JWT_VALUE,
      },
      in: {
        method: 'GET',
        pathParameters: {},
        queryStringParameters: {},
        headers: {
          authorization: VALID_JWT_VALUE,
        },
        headersNormalizerRequestRaw: {
          Authorization: VALID_JWT_VALUE,
        },
        userId: 'test-sub',
      },
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an error case', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), mockJwtAuthenticatorDeps, Effect.runPromise);

    await expect(result).rejects.toThrow('Invalid JWT credentials');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
