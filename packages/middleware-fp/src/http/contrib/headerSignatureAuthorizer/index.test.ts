import * as hashUtils from '@konker.dev/tiny-utils-fp/hash';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { echoCoreIn200W } from '../../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../../request.js';
import * as unit from './index.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

export const CORRECT_TEST_HMAC_VALUE = 'test-hmac-value';
export const INCORRECT_TEST_HMAC_VALUE = 'wrong-hmac-value';
export const TEST_SIGNATURE_HEADER_NAME = 'x-test-signature';
export const TEST_SECRET = 'test-secret';

export const HEADER_SIGNATURE_AUTHORIZER_TEST_DEPS: unit.HeaderSignatureAuthorizerDeps =
  unit.HeaderSignatureAuthorizerDeps.of({
    secret: TEST_SECRET,
    signatureHeaderName: TEST_SIGNATURE_HEADER_NAME,
  });

export const mockHeaderSignatureAuthorizerDeps = Effect.provideService(
  unit.HeaderSignatureAuthorizerDeps,
  HEADER_SIGNATURE_AUTHORIZER_TEST_DEPS
);

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, {
  method: 'POST',
  body: 'TEST_BODY',
  headers: {
    [TEST_SIGNATURE_HEADER_NAME]: CORRECT_TEST_HMAC_VALUE,
  },
});

const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, {
  method: 'POST',
  body: 'TEST_BODY',
  headers: {
    [TEST_SIGNATURE_HEADER_NAME]: INCORRECT_TEST_HMAC_VALUE,
  },
});

describe('middleware/header-signature-authorizer', () => {
  let errorSpy: MockInstance;

  beforeEach(() => {
    vi.spyOn(hashUtils, 'sha256HmacHex').mockReturnValue(Effect.succeed(CORRECT_TEST_HMAC_VALUE));
    vi.spyOn(Effect, 'logDebug').mockReturnValue(Effect.succeed(undefined));
    errorSpy = vi.spyOn(Effect, 'logError').mockReturnValue(Effect.succeed(undefined));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work as expected in an success case', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = await pipe(egHandler(TEST_IN_1), mockHeaderSignatureAuthorizerDeps, Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 200,
      body: 'TEST_BODY',
      headers: {
        'x-test-signature': 'test-hmac-value',
      },
      in: {
        body: 'TEST_BODY',
        headers: {
          'x-test-signature': 'test-hmac-value',
        },
        method: 'POST',
        pathParameters: {},
        queryStringParameters: {},
      },
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an error case', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), mockHeaderSignatureAuthorizerDeps, Effect.runPromise);

    await expect(result).rejects.toThrow('Invalid signature');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
