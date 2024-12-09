import type { JwtVerificationConfig } from '@konker.dev/tiny-auth-utils-fp/dist/jwt';
import {
  TEST_JWT_ISS,
  TEST_JWT_NOW_MS,
  TEST_JWT_SIGNING_SECRET,
} from '@konker.dev/tiny-auth-utils-fp/dist/test/fixtures/jwt';
import { TEST_TOKEN } from '@konker.dev/tiny-auth-utils-fp/dist/test/fixtures/test-jwt-tokens';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { echoCoreIn } from '../test/test-common';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types';
import * as unit from './jwtAuthenticator';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

export const JWT_AUTHENTICATOR_TEST_DEPS: JwtVerificationConfig = unit.JwtAuthenticatorDeps.of({
  signingSecret: TEST_JWT_SIGNING_SECRET,
  issuer: TEST_JWT_ISS,
});

export const mockJwtAuthenticatorDeps = Effect.provideService(unit.JwtAuthenticatorDeps, JWT_AUTHENTICATOR_TEST_DEPS);

const VALID_JWT_RSA_VALUE = `Bearer ${TEST_TOKEN}`;
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
    const egHandler = pipe(echoCoreIn, unit.middleware());
    const result = await pipe(egHandler(TEST_IN_1), mockJwtAuthenticatorDeps, Effect.runPromise);

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
    const result = pipe(egHandler(TEST_IN_2), mockJwtAuthenticatorDeps, Effect.runPromise);

    await expect(result).rejects.toThrow('Invalid JWT credentials');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
