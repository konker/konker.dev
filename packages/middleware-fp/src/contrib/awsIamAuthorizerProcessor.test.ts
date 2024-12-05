import * as P from '@konker.dev/effect-ts-prelude';

import {
  generateLambdaAuthResultAllow,
  generateLambdaAuthResultDeny,
} from '@konker.dev/tiny-auth-utils-fp/dist/aws-authorizer';
import type { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';

import type { Handler } from '../index';
import * as unit from './awsIamAuthorizerProcessor';

const TEST_IN: APIGatewayRequestAuthorizerEventV2 = {
  headers: {},
  requestContext: {} as any,
  routeArn: 'SOME_ARN',
} as APIGatewayRequestAuthorizerEventV2;

const TEST_OUT_1 = {
  principalId: 'SOME_PRINCIPAL',
  routeArn: 'SOME_ARN',
};

const TEST_OUT_2 = P.toError('Some Error Message');

export const testCoreL =
  (e: Error): Handler<APIGatewayRequestAuthorizerEventV2, APIGatewayAuthorizerResult, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    P.Effect.fail(e);

export const testCoreRA =
  (out: any): Handler<APIGatewayRequestAuthorizerEventV2, APIGatewayAuthorizerResult, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    P.Effect.succeed(generateLambdaAuthResultAllow(out.principalId, out.routeArn));

export const testCoreRD =
  (out: any): Handler<APIGatewayRequestAuthorizerEventV2, APIGatewayAuthorizerResult, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    P.Effect.succeed(generateLambdaAuthResultDeny(out.principalId, out.routeArn));

describe('middleware/aws-iam-authorizer-processor', () => {
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

    expect(result).toStrictEqual({
      context: {
        principalId: 'SOME_PRINCIPAL',
      },
      policyDocument: {
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: 'SOME_ARN',
          },
        ],
        Version: '2012-10-17',
      },
      principalId: 'SOME_PRINCIPAL',
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  test('it should work as expected in an success case (Deny)', async () => {
    const stack = P.pipe(testCoreRD(TEST_OUT_1), unit.middleware());
    const result = await P.pipe(stack(TEST_IN), P.Effect.runPromise);

    expect(result).toStrictEqual({
      context: {
        principalId: 'SOME_PRINCIPAL',
      },
      policyDocument: {
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: 'SOME_ARN',
          },
        ],
        Version: '2012-10-17',
      },
      principalId: 'SOME_PRINCIPAL',
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  test('it should work as expected in an error case', async () => {
    const stack = P.pipe(testCoreL(TEST_OUT_2), unit.middleware());
    const result = await P.pipe(stack(TEST_IN), P.Effect.runPromise);

    expect(result).toStrictEqual({
      context: {
        principalId: 'anon',
      },
      policyDocument: {
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      principalId: 'anon',
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
