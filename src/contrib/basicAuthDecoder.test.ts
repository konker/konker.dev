import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { echoCoreIn } from '../test/test-common';
import * as unit from './basicAuthDecoder';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types';

// user0:secret-0
const VALID_BASIC_AUTH_VALUE = 'Basic dXNlcjA6c2VjcmV0LTA=';

const TEST_IN_1 = {
  headers: {
    authorization: VALID_BASIC_AUTH_VALUE,
  },
  isBase64Encoded: false,
  body: {},
} as unknown as APIGatewayProxyEventV2 & WithNormalizedInputHeaders;

const TEST_IN_2 = {
  headers: {},
  isBase64Encoded: false,
  body: {},
} as unknown as APIGatewayProxyEventV2 & WithNormalizedInputHeaders;

describe('middleware/basic-auth-decoder', () => {
  beforeEach(() => {
    jest.spyOn(P.Effect, 'logDebug').mockReturnValue(P.Effect.succeed(undefined));
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should work as expected in an success case', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware());
    const result = await P.pipe(egHandler(TEST_IN_1), P.Effect.runPromise);

    expect(result).toStrictEqual({
      headers: {
        authorization: VALID_BASIC_AUTH_VALUE,
      },
      body: {},
      isBase64Encoded: false,
      userId: 'user0',
    });
  });

  test('it should work as expected in an error case', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware());
    const result = P.pipe(egHandler(TEST_IN_2), P.Effect.runPromise);

    await expect(() => result).rejects.toThrow('No token found');
  });
});
