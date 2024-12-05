import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { echoCoreIn } from '../test/test-common';
import * as unit from './basicAuthAuthenticator';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types';

export const BASIC_AUTH_AUTHENTICATOR_TEST_DEPS: unit.BasicAuthAuthenticatorDeps = unit.BasicAuthAuthenticatorDeps.of({
  validBasicAuthCredentialSet: [
    {
      username: 'user0',
      passwords: ['secret-0', 'secret-1'],
    },
  ],
});

export const mockBasicAuthAuthenticatorDeps = P.Effect.provideService(
  unit.BasicAuthAuthenticatorDeps,
  BASIC_AUTH_AUTHENTICATOR_TEST_DEPS
);

// user0:secret-0
const VALID_BASIC_AUTH_VALUE = 'Basic dXNlcjA6c2VjcmV0LTA=';

// user0:bad-secret
const INVALID_BASIC_AUTH_VALUE = 'Basic dXNlcjA6YmFkLXNlY3JldA==';

const TEST_IN_1 = {
  headers: {
    authorization: VALID_BASIC_AUTH_VALUE,
  },
  isBase64Encoded: false,
  body: {},
} as unknown as APIGatewayProxyEventV2 & WithNormalizedInputHeaders;

const TEST_IN_2 = {
  headers: {
    authorization: INVALID_BASIC_AUTH_VALUE,
  },
  isBase64Encoded: false,
  body: {},
} as unknown as APIGatewayProxyEventV2 & WithNormalizedInputHeaders;

describe('middleware/basic-auth-authenticator', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(P.Effect, 'logDebug').mockReturnValue(P.Effect.succeed(undefined));
    errorSpy = jest.spyOn(P.Effect, 'logError').mockReturnValue(P.Effect.succeed(undefined));
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should work as expected in an success case', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware());
    const result = await P.pipe(egHandler(TEST_IN_1), mockBasicAuthAuthenticatorDeps, P.Effect.runPromise);

    expect(result).toStrictEqual({
      headers: {
        authorization: VALID_BASIC_AUTH_VALUE,
      },
      body: {},
      isBase64Encoded: false,
      userId: 'user0',
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  test('it should work as expected in an error case', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware());
    const result = P.pipe(egHandler(TEST_IN_2), mockBasicAuthAuthenticatorDeps, P.Effect.runPromise);

    await expect(() => result).rejects.toThrow('Invalid basic auth credentials');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
