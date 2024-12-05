import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { http200CoreIn } from '../test/test-common';
import * as unit from './pathTokenAuthorizer';

export const CORRECT_TEST_PATH_TOKEN_VALUE = 'test-token-value';
export const INCORRECT_TEST_PATH_TOKEN_VALUE = 'wrong-token-value';
export const TEST_SECRET_TOKEN_ENV_NAME = 'test-secret-token-env-name';

export const PATH_TOKEN_AUTHORIZER_TEST_DEPS: unit.PathTokenAuthorizerDeps = unit.PathTokenAuthorizerDeps.of({
  secretTokenEnvName: TEST_SECRET_TOKEN_ENV_NAME,
  pathParamName: 'pathToken',
});

export const mockPathTokenAuthorizerDeps = P.Effect.provideService(
  unit.PathTokenAuthorizerDeps,
  PATH_TOKEN_AUTHORIZER_TEST_DEPS
);

const TEST_IN_1: APIGatewayProxyEventV2 = {
  headers: {},
  isBase64Encoded: false,
  requestContext: {} as any,
  body: {},
  pathParameters: {
    pathToken: CORRECT_TEST_PATH_TOKEN_VALUE,
  },
} as unknown as APIGatewayProxyEventV2;

const TEST_IN_2: APIGatewayProxyEventV2 = {
  headers: {},
  isBase64Encoded: false,
  requestContext: {} as any,
  body: {},
  pathParameters: {
    pathToken: INCORRECT_TEST_PATH_TOKEN_VALUE,
  },
} as unknown as APIGatewayProxyEventV2;

describe('middleware/path-token-authorizer', () => {
  let errorSpy: jest.SpyInstance;
  let oldEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    oldEnv = process.env;
    process.env = {
      [TEST_SECRET_TOKEN_ENV_NAME]: CORRECT_TEST_PATH_TOKEN_VALUE,
    };

    jest.spyOn(P.Effect, 'logDebug').mockReturnValue(P.Effect.succeed(undefined));
    errorSpy = jest.spyOn(P.Effect, 'logError').mockReturnValue(P.Effect.succeed(undefined));
  });
  afterEach(() => {
    jest.restoreAllMocks();
    process.env = oldEnv;
  });

  test('it should work as expected in an success case', async () => {
    const egHandler = P.pipe(http200CoreIn, unit.middleware());
    const result = await P.pipe(egHandler(TEST_IN_1), mockPathTokenAuthorizerDeps, P.Effect.runPromise);

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
