import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { http200CoreIn } from '../test/test-common';
import * as unit from './pathTokenAuthorizer';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

export const CORRECT_TEST_PATH_TOKEN_VALUE = 'test-token-value';
export const INCORRECT_TEST_PATH_TOKEN_VALUE = 'wrong-token-value';
export const TEST_SECRET_TOKEN_ENV_NAME = 'test-secret-token-env-name';

export const PATH_TOKEN_AUTHORIZER_TEST_DEPS: unit.PathTokenAuthorizerDeps = unit.PathTokenAuthorizerDeps.of({
  secretTokenEnvName: TEST_SECRET_TOKEN_ENV_NAME,
  pathParamName: 'pathToken',
});

export const mockPathTokenAuthorizerDeps = Effect.provideService(
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

describe('middleware/path-token-authorizer KONK90', () => {
  let errorSpy: MockInstance;
  let oldEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    oldEnv = process.env;
    process.env = {
      [TEST_SECRET_TOKEN_ENV_NAME]: CORRECT_TEST_PATH_TOKEN_VALUE,
    };

    vi.spyOn(Effect, 'logDebug').mockReturnValue(Effect.succeed(undefined));
    errorSpy = vi.spyOn(Effect, 'logError').mockReturnValue(Effect.succeed(undefined));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    process.env = oldEnv;
  });

  it('should work as expected in an success case', async () => {
    const egHandler = pipe(http200CoreIn, unit.middleware());
    const result = await pipe(egHandler(TEST_IN_1), mockPathTokenAuthorizerDeps, Effect.runPromise);

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

  it('should work as expected in an error case', async () => {
    const egHandler = pipe(http200CoreIn, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), mockPathTokenAuthorizerDeps, Effect.runPromise);

    await expect(result).rejects.toThrow('Invalid token');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
