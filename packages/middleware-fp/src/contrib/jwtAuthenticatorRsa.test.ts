import type { JwtVerificationConfigRsa } from '@konker.dev/tiny-auth-utils-fp/dist/jwt/rsa';
import { TEST_JWT_NOW_MS } from '@konker.dev/tiny-auth-utils-fp/dist/test/fixtures/jwt';
import { TEST_RSA_KEY_PUBLIC } from '@konker.dev/tiny-auth-utils-fp/dist/test/fixtures/test-jwt-rsa-keys';
import { TEST_TOKEN_RSA } from '@konker.dev/tiny-auth-utils-fp/dist/test/fixtures/test-jwt-tokens-rsa';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { echoCoreIn } from '../test/test-common';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types';
import * as unit from './jwtAuthenticatorRsa';

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

const TEST_IN_1 = {
  headers: {
    authorization: VALID_JWT_RSA_VALUE,
  },
  isBase64Encoded: false,
  body: {},
} as unknown as APIGatewayProxyEventV2 & WithNormalizedInputHeaders;

const TEST_IN_2 = {
  headers: {
    authorization: INVALID_JWT_RSA_VALUE,
  },
  isBase64Encoded: false,
  body: {},
} as unknown as APIGatewayProxyEventV2 & WithNormalizedInputHeaders;

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
    const egHandler = pipe(echoCoreIn, unit.middleware());
    const result = await pipe(egHandler(TEST_IN_1), mockJwtAuthenticatorRsaDeps, Effect.runPromise);

    expect(result).toStrictEqual({
      headers: {
        authorization: VALID_JWT_RSA_VALUE,
      },
      body: {},
      isBase64Encoded: false,
      userId: 'test-sub',
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an error case', async () => {
    const egHandler = pipe(echoCoreIn, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), mockJwtAuthenticatorRsaDeps, Effect.runPromise);

    await expect(result).rejects.toThrow('Invalid JWT RSA credentials');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
