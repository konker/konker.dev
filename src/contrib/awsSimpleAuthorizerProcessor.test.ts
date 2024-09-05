import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';

import type { Handler } from '../index';
import type { BaseSimpleAuthResponse } from '../lib/http';
import * as unit from './awsSimpleAuthorizerProcessor';

const TEST_IN: APIGatewayRequestAuthorizerEventV2 = {
  headers: {},
  requestContext: {} as any,
  routeArn: 'SOME_ARN',
} as APIGatewayRequestAuthorizerEventV2;

const TEST_OUT_1 = {
  foo: 'abc',
  bar: 123,
};

const TEST_OUT_2 = P.toError('Some Error Message');

export const testCoreL =
  (e: Error): Handler<APIGatewayRequestAuthorizerEventV2, BaseSimpleAuthResponse, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    P.Effect.fail(e);

export const testCoreRA =
  (out: any): Handler<APIGatewayRequestAuthorizerEventV2, BaseSimpleAuthResponse, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    P.Effect.succeed({
      ...out,
      isAuthorized: true,
    });

export const testCoreRD =
  (out: any): Handler<APIGatewayRequestAuthorizerEventV2, BaseSimpleAuthResponse, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    P.Effect.succeed({
      ...out,
      isAuthorized: false,
    });

describe('middleware/aws-simple-authorizer-processor', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(P.Effect, 'logDebug').mockReturnValue(P.Effect.succeed(undefined));
    errorSpy = jest.spyOn(P.Effect, 'logError').mockReturnValue(P.Effect.succeed(undefined));
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should work as expected in an success case (Allow)', async () => {
    const stack = P.pipe(testCoreRA(TEST_OUT_1), unit.middleware());
    const result = await P.pipe(stack(TEST_IN), P.Effect.runPromise);

    expect(result).toStrictEqual({ isAuthorized: true });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  test('it should work as expected in an success case (Deny)', async () => {
    const stack = P.pipe(testCoreRD(TEST_OUT_1), unit.middleware());
    const result = await P.pipe(stack(TEST_IN), P.Effect.runPromise);

    expect(result).toStrictEqual({ isAuthorized: false });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  test('it should work as expected in an error case', async () => {
    const stack = P.pipe(testCoreL(TEST_OUT_2), unit.middleware());
    const result = await P.pipe(stack(TEST_IN), P.Effect.runPromise);

    expect(result).toStrictEqual({ isAuthorized: false });
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
