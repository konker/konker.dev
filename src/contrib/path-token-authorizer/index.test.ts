import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { http200CoreIn } from '../../test/test-common';
import * as unit from './index';
import { PathTokenAuthorizerDeps } from './index';

export const PATH_TOKEN_AUTHORIZER_TEST_DEPS: unit.PathTokenAuthorizerDeps = unit.PathTokenAuthorizerDeps.of({
  secretToken: 'test-secret-token',
  pathParamName: 'token',
});

export const mockPathTokenAuthorizerDeps = P.Effect.provideService(
  PathTokenAuthorizerDeps,
  PATH_TOKEN_AUTHORIZER_TEST_DEPS
);

const TEST_IN_1: APIGatewayProxyEventV2 = {
  headers: {},
  isBase64Encoded: false,
  requestContext: {} as any,
  body: {},
  pathParameters: {
    token: 'test-secret-token',
  },
} as unknown as APIGatewayProxyEventV2;

const TEST_IN_2: APIGatewayProxyEventV2 = {
  headers: {},
  isBase64Encoded: false,
  requestContext: {} as any,
  body: {},
  pathParameters: {
    token: 'wrong-token',
  },
} as unknown as APIGatewayProxyEventV2;

describe('middleware/path-token-authorizer', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(P.Effect, 'logDebug').mockReturnValue(P.Effect.succeed(undefined));
    errorSpy = jest.spyOn(P.Effect, 'logError').mockReturnValue(P.Effect.succeed(undefined));
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should work as expected in an success case', async () => {
    const egHandler = P.pipe(http200CoreIn, unit.middleware());
    const result = await P.pipe(
      egHandler(TEST_IN_1),
      (x) => x,
      mockPathTokenAuthorizerDeps,
      (x) => x,
      P.Effect.runPromise,
      (x) => x
    );

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
    const result = P.pipe(egHandler(TEST_IN_2), mockPathTokenAuthorizerDeps, P.Effect.runPromise);

    await expect(() => result).rejects.toThrow('Invalid token');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
