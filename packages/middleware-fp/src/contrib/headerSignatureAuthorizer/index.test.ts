import * as P from '@konker.dev/effect-ts-prelude';

import * as hashUtils from '@konker.dev/tiny-utils-fp/dist/hash';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { http200CoreIn } from '../../test/test-common';
import * as unit from './index';

export const CORRECT_TEST_HMAC_VALUE = 'test-hmac-value';
export const INCORRECT_TEST_HMAC_VALUE = 'wrong-hmac-value';
export const TEST_SIGNATURE_HEADER_NAME = 'x-test-signature';
export const TEST_SECRET = 'test-secret';

export const HEADER_SIGNATURE_AUTHORIZER_TEST_DEPS: unit.HeaderSignatureAuthorizerDeps =
  unit.HeaderSignatureAuthorizerDeps.of({
    secret: TEST_SECRET,
    signatureHeaderName: TEST_SIGNATURE_HEADER_NAME,
  });

export const mockHeaderSignatureAuthorizerDeps = P.Effect.provideService(
  unit.HeaderSignatureAuthorizerDeps,
  HEADER_SIGNATURE_AUTHORIZER_TEST_DEPS
);

const TEST_IN_1: APIGatewayProxyEventV2 = {
  isBase64Encoded: false,
  requestContext: {} as any,
  body: 'TEST_BODY',
  headers: {
    [TEST_SIGNATURE_HEADER_NAME]: CORRECT_TEST_HMAC_VALUE,
  },
} as unknown as APIGatewayProxyEventV2;

const TEST_IN_2: APIGatewayProxyEventV2 = {
  isBase64Encoded: false,
  requestContext: {} as any,
  body: 'TEST_BODY',
  headers: {
    [TEST_SIGNATURE_HEADER_NAME]: INCORRECT_TEST_HMAC_VALUE,
  },
} as unknown as APIGatewayProxyEventV2;

describe('middleware/header-signature-authorizer', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(hashUtils, 'sha256HmacHex').mockReturnValue(P.Effect.succeed(CORRECT_TEST_HMAC_VALUE));
    jest.spyOn(P.Effect, 'logDebug').mockReturnValue(P.Effect.succeed(undefined));
    errorSpy = jest.spyOn(P.Effect, 'logError').mockReturnValue(P.Effect.succeed(undefined));
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should work as expected in an success case', async () => {
    const egHandler = P.pipe(http200CoreIn, unit.middleware());
    const result = await P.pipe(egHandler(TEST_IN_1), mockHeaderSignatureAuthorizerDeps, P.Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 200,
      headers: {
        QUX: 'qux_value',
      },
      body: JSON.stringify({ result: 'OK' }),
      isBase64Encoded: false,
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  test('it should work as expected in an error case', async () => {
    const egHandler = P.pipe(http200CoreIn, unit.middleware());
    const result = P.pipe(egHandler(TEST_IN_2), mockHeaderSignatureAuthorizerDeps, P.Effect.runPromise);

    await expect(() => result).rejects.toThrow('Invalid signature');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
