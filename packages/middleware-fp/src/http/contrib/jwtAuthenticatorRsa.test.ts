import type { JwtVerificationConfigRsa } from '@konker.dev/tiny-auth-utils-fp/jwt/rsa';
import { TEST_JWT_NOW_MS } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/jwt';
import { TEST_RSA_KEY_PUBLIC } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/test-jwt-rsa-keys';
import { TEST_TOKEN_RSA } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/test-jwt-tokens-rsa';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { echoCoreIn200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../RequestW.js';
import * as unit from './jwtAuthenticatorRsa.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

export const JWT_AUTHENTICATOR_RSA_TEST_DEPS: JwtVerificationConfigRsa = unit.JwtAuthenticatorRsaDeps.of({
  rsaPublicKey: TEST_RSA_KEY_PUBLIC,
  issuer: 'test-iss',
});

export const mockJwtAuthenticatorRsaDeps = Effect.provideService(
  unit.JwtAuthenticatorRsaDeps,
  JWT_AUTHENTICATOR_RSA_TEST_DEPS
);

const VALID_JWT_RSA_VALUE = `Bearer ${TEST_TOKEN_RSA}`;
const INVALID_JWT_RSA_VALUE = 'Bearer Banana';

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, {
  headers: {
    authorization: VALID_JWT_RSA_VALUE,
  },
  headersNormalizerRequestRaw: {
    Authorization: VALID_JWT_RSA_VALUE,
  },
});

const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, {
  headers: {
    authorization: INVALID_JWT_RSA_VALUE,
  },
  headersNormalizerRequestRaw: {
    authorization: INVALID_JWT_RSA_VALUE,
  },
});

describe('middleware/jwt-authenticator-rsa', () => {
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
    const result = await pipe(egHandler(TEST_IN_1), mockJwtAuthenticatorRsaDeps, Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: {
        authorization: VALID_JWT_RSA_VALUE,
      },
      in: {
        url: '/',
        method: 'GET',
        pathParameters: {},
        queryStringParameters: {},
        headers: {
          authorization: VALID_JWT_RSA_VALUE,
        },
        headersNormalizerRequestRaw: {
          Authorization: VALID_JWT_RSA_VALUE,
        },
        userId: 'test-sub',
      },
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an error case', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), mockJwtAuthenticatorRsaDeps, Effect.runPromise);

    await expect(result).rejects.toThrow('Invalid JWT RSA credentials');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
