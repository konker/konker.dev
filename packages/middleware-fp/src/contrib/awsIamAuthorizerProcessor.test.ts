import {
  generateLambdaAuthResultAllow,
  generateLambdaAuthResultDeny,
} from '@konker.dev/tiny-auth-utils-fp/aws-authorizer';
import { toError } from '@konker.dev/tiny-error-fp/lib';
import type { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import type { Handler } from '../index.js';
import * as unit from './awsIamAuthorizerProcessor.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

const TEST_IN: APIGatewayRequestAuthorizerEventV2 = {
  headers: {},
  requestContext: {} as any,
  routeArn: 'SOME_ARN',
} as APIGatewayRequestAuthorizerEventV2;

const TEST_OUT_1 = {
  principalId: 'SOME_PRINCIPAL',
  routeArn: 'SOME_ARN',
};

const TEST_OUT_2 = toError('Some Error Message');

export const testCoreL =
  (e: Error): Handler<APIGatewayRequestAuthorizerEventV2, APIGatewayAuthorizerResult, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    Effect.fail(e);

export const testCoreRA =
  (out: any): Handler<APIGatewayRequestAuthorizerEventV2, APIGatewayAuthorizerResult, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    Effect.succeed(generateLambdaAuthResultAllow(out.principalId, out.routeArn));

export const testCoreRD =
  (out: any): Handler<APIGatewayRequestAuthorizerEventV2, APIGatewayAuthorizerResult, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    Effect.succeed(generateLambdaAuthResultDeny(out.principalId, out.routeArn));

describe('middleware/aws-iam-authorizer-processor', () => {
  let errorSpy: MockInstance;

  beforeEach(() => {
    vi.spyOn(Effect, 'logDebug').mockReturnValue(Effect.succeed(undefined));
    errorSpy = vi.spyOn(Effect, 'logError').mockReturnValue(Effect.succeed(undefined));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work as expected in an success case (Allow)', async () => {
    const stack = pipe(testCoreRA(TEST_OUT_1), unit.middleware());
    const result = await pipe(stack(TEST_IN), Effect.runPromise);

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

  it('should work as expected in an success case (Deny)', async () => {
    const stack = pipe(testCoreRD(TEST_OUT_1), unit.middleware());
    const result = await pipe(stack(TEST_IN), Effect.runPromise);

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

  it('should work as expected in an error case', async () => {
    const stack = pipe(testCoreL(TEST_OUT_2), unit.middleware());
    const result = await pipe(stack(TEST_IN), Effect.runPromise);

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
