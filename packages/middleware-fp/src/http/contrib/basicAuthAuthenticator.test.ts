import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { echoCoreIn200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../request.js';
import * as unit from './basicAuthAuthenticator.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

export const BASIC_AUTH_AUTHENTICATOR_TEST_DEPS: unit.BasicAuthAuthenticatorDeps = unit.BasicAuthAuthenticatorDeps.of({
  validBasicAuthCredentialSet: [
    {
      username: 'user0',
      passwords: ['secret-0', 'secret-1'],
    },
  ],
});

export const mockBasicAuthAuthenticatorDeps = Effect.provideService(
  unit.BasicAuthAuthenticatorDeps,
  BASIC_AUTH_AUTHENTICATOR_TEST_DEPS
);

// user0:secret-0
const VALID_BASIC_AUTH_VALUE = 'Basic dXNlcjA6c2VjcmV0LTA=';

// user0:bad-secret
const INVALID_BASIC_AUTH_VALUE = 'Basic dXNlcjA6YmFkLXNlY3JldA==';

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, {
  headers: {
    authorization: VALID_BASIC_AUTH_VALUE,
  },
  headersNormalizerRequestRaw: {
    Authorization: VALID_BASIC_AUTH_VALUE,
  },
});

const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, {
  headers: {
    authorization: INVALID_BASIC_AUTH_VALUE,
  },
  headersNormalizerRequestRaw: {
    Authorization: INVALID_BASIC_AUTH_VALUE,
  },
});

describe('middleware/basic-auth-authenticator', () => {
  let errorSpy: MockInstance;

  beforeEach(() => {
    vi.spyOn(Effect, 'logDebug').mockReturnValue(Effect.succeed(undefined));
    errorSpy = vi.spyOn(Effect, 'logError').mockReturnValue(Effect.succeed(undefined));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work as expected in an success case', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = await pipe(egHandler(TEST_IN_1), mockBasicAuthAuthenticatorDeps, Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: {
        authorization: 'Basic dXNlcjA6c2VjcmV0LTA=',
      },
      in: {
        url: '/',
        headers: {
          authorization: 'Basic dXNlcjA6c2VjcmV0LTA=',
        },
        method: 'GET',
        headersNormalizerRequestRaw: {
          Authorization: 'Basic dXNlcjA6c2VjcmV0LTA=',
        },
        pathParameters: {},
        queryStringParameters: {},
        userId: 'user0',
      },
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an error case', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), mockBasicAuthAuthenticatorDeps, Effect.runPromise);

    await expect(result).rejects.toThrow('Invalid basic auth credentials');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
