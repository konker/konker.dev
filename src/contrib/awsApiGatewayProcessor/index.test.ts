import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import type { Handler } from '../../index';
import type { BaseResponse } from '../../lib/http';
import { HttpApiError } from '../../lib/HttpApiError';
import { TestDeps } from '../../test/test-common';
import * as unit from './index';

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
    P.Effect.fail(out);

export const testCoreR =
  (out: any): Handler<APIGatewayProxyEventV2, BaseResponse, Error, unknown> =>
  (_: APIGatewayProxyEventV2) =>
    P.Effect.succeed(out);

describe('middleware/api-gateway-processor', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(P.Effect, 'logDebug').mockReturnValue(P.Effect.succeed(undefined));
    errorSpy = jest.spyOn(P.Effect, 'logError').mockReturnValue(P.Effect.succeed(undefined));
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('it should work as expected in an success case', async () => {
    const stack = P.pipe(testCoreR(TEST_OUT_1), unit.middleware());
    const result = await P.pipe(stack(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);

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

  test('it should work as expected in an success case with string body', async () => {
    const stack = P.pipe(testCoreR(TEST_OUT_2), unit.middleware());
    const result = await P.pipe(stack(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);

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

  test('it should work as expected in an error case', async () => {
    const stack = P.pipe(testCoreL(TEST_OUT_3), unit.middleware());
    const result = await P.pipe(stack(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);

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
