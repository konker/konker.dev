import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import type { Handler } from '../index';
import type { BaseResponse } from '../lib/http';
import { HttpApiError } from '../lib/HttpApiError';
import { TestDeps } from '../test/test-common';
import * as unit from './awsApiGatewayProcessor';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

const TEST_IN: APIGatewayProxyEventV2 = {
  headers: {},
  isBase64Encoded: false,
  requestContext: {} as any,
  body: {},
} as APIGatewayProxyEventV2;
const TEST_DEPS: TestDeps = TestDeps.of({ bar: 'bar' });

const TEST_OUT_1 = {
  statusCode: 200,
  headers: {
    QUX: 'qux_value',
  },
  isBase64Encoded: false,
  body: { foo: 'foo_value' },
};

const TEST_OUT_2 = {
  statusCode: 200,
  headers: {
    QUX: 'qux_value',
  },
  isBase64Encoded: false,
  body: 'string body',
};
const TEST_OUT_3 = HttpApiError('SomeError', 'Some Error Message', 409);

export const testCoreL =
  (out: any): Handler<APIGatewayProxyEventV2, BaseResponse, Error, unknown> =>
  (_: APIGatewayProxyEventV2) =>
    Effect.fail(out);

export const testCoreR =
  (out: any): Handler<APIGatewayProxyEventV2, BaseResponse, Error, unknown> =>
  (_: APIGatewayProxyEventV2) =>
    Effect.succeed(out);

describe('middleware/aws-api-gateway-processor', () => {
  let errorSpy: MockInstance;

  beforeEach(() => {
    vi.spyOn(Effect, 'logDebug').mockReturnValue(Effect.succeed(undefined));
    errorSpy = vi.spyOn(Effect, 'logError').mockReturnValue(Effect.succeed(undefined));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work as expected in an success case', async () => {
    const stack = pipe(testCoreR(TEST_OUT_1), unit.middleware());
    const result = await pipe(stack(TEST_IN), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 200,
      headers: {
        QUX: 'qux_value',
      },
      body: JSON.stringify({ foo: 'foo_value' }),
      isBase64Encoded: false,
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an success case with string body', async () => {
    const stack = pipe(testCoreR(TEST_OUT_2), unit.middleware());
    const result = await pipe(stack(TEST_IN), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 200,
      headers: {
        QUX: 'qux_value',
      },
      body: 'string body',
      isBase64Encoded: false,
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an error case', async () => {
    const stack = pipe(testCoreL(TEST_OUT_3), unit.middleware());
    const result = await pipe(stack(TEST_IN), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 409,
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'SomeError: Some Error Message', statusCode: 409 }),
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
