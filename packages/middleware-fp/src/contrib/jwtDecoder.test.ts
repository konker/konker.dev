import * as P from '@konker.dev/effect-ts-prelude';

import { TEST_JWT_NOW_MS } from '@konker.dev/tiny-auth-utils-fp/dist/test/fixtures/jwt';
import { TEST_TOKEN } from '@konker.dev/tiny-auth-utils-fp/dist/test/fixtures/test-jwt-tokens';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { echoCoreIn } from '../test/test-common';
import type { WithNormalizedInputHeaders } from './headersNormalizer/types';
import * as unit from './jwtDecoder';

const VALID_JWT_VALUE = `Bearer ${TEST_TOKEN}`;
const INVALID_JWT_VALUE = 'Bearer Banana';

const TEST_IN_1 = {
  headers: {
    authorization: VALID_JWT_VALUE,
  },
  isBase64Encoded: false,
  body: {},
} as unknown as APIGatewayProxyEventV2 & WithNormalizedInputHeaders;

const TEST_IN_2 = {
  headers: {
    authorization: INVALID_JWT_VALUE,
  },
  isBase64Encoded: false,
  body: {},
} as unknown as APIGatewayProxyEventV2 & WithNormalizedInputHeaders;

describe('middleware/jwt-decoder', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);
    jest.spyOn(P.Effect, 'logDebug').mockReturnValue(P.Effect.succeed(undefined));
    errorSpy = jest.spyOn(P.Effect, 'logError').mockReturnValue(P.Effect.succeed(undefined));
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should work as expected in an success case', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware());
    const result = await P.pipe(egHandler(TEST_IN_1), P.Effect.runPromise);

    expect(result).toStrictEqual({
      headers: {
        authorization: VALID_JWT_VALUE,
      },
      body: {},
      isBase64Encoded: false,
      userId: 'test-sub',
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  test('it should work as expected in an error case', async () => {
    const egHandler = P.pipe(echoCoreIn, unit.middleware());
    const result = P.pipe(egHandler(TEST_IN_2), P.Effect.runPromise);

    await expect(() => result).rejects.toThrow('Invalid JWT credentials');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
