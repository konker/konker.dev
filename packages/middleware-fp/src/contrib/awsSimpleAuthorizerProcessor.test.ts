import { toError } from '@konker.dev/tiny-error-fp/lib';
import type { APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import type { Handler } from '../index.js';
import type { BaseSimpleAuthResponse } from '../lib/http.js';
import * as unit from './awsSimpleAuthorizerProcessor.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

const TEST_IN: APIGatewayRequestAuthorizerEventV2 = {
  headers: {},
  requestContext: {} as any,
  routeArn: 'SOME_ARN',
} as APIGatewayRequestAuthorizerEventV2;

const TEST_OUT_1 = {
  foo: 'abc',
  bar: 123,
};

const TEST_OUT_2 = toError('Some Error Message');

export const testCoreL =
  (e: Error): Handler<APIGatewayRequestAuthorizerEventV2, BaseSimpleAuthResponse, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    Effect.fail(e);

export const testCoreRA =
  (out: any): Handler<APIGatewayRequestAuthorizerEventV2, BaseSimpleAuthResponse, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    Effect.succeed({
      ...out,
      isAuthorized: true,
    });

export const testCoreRD =
  (out: any): Handler<APIGatewayRequestAuthorizerEventV2, BaseSimpleAuthResponse, Error, never> =>
  (_: APIGatewayRequestAuthorizerEventV2) =>
    Effect.succeed({
      ...out,
      isAuthorized: false,
    });

describe('middleware/aws-simple-authorizer-processor', () => {
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

    expect(result).toStrictEqual({ isAuthorized: true });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an success case (Deny)', async () => {
    const stack = pipe(testCoreRD(TEST_OUT_1), unit.middleware());
    const result = await pipe(stack(TEST_IN), Effect.runPromise);

    expect(result).toStrictEqual({ isAuthorized: false });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an error case', async () => {
    const stack = pipe(testCoreL(TEST_OUT_2), unit.middleware());
    const result = await pipe(stack(TEST_IN), Effect.runPromise);

    expect(result).toStrictEqual({ isAuthorized: false });
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
