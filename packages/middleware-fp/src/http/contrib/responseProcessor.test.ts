import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import type { Handler } from '../../index.js';
import { TestDepsW } from '../../test/test-common.js';
import { HttpApiError } from '../HttpApiError.js';
import { EMPTY_REQUEST_W, type RequestW } from '../request.js';
import { makeResponseW, type ResponseW } from '../response.js';
import * as unit from './responseProcessor.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

const TEST_DEPS: TestDepsW = TestDepsW.of({ bar: 'bar' });

const TEST_OUT_1 = makeResponseW({
  statusCode: 200,
  headers: {
    QUX: 'qux_value',
  },
  body: JSON.stringify({ foo: 'foo_value' }),
});

const TEST_OUT_2 = makeResponseW({
  statusCode: 200,
  headers: {
    QUX: 'qux_value',
  },
  body: 'string body',
});
const TEST_OUT_3 = HttpApiError('SomeError', 'Some Error Message', 409);

export const testCoreL =
  (out: any): Handler<RequestW, ResponseW, Error, unknown> =>
  (_: RequestW) =>
    Effect.fail(out);

export const testCoreR =
  (out: any): Handler<RequestW, ResponseW, Error, unknown> =>
  (_: RequestW) =>
    Effect.succeed(out);

describe('middleware/responseProcessor', () => {
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
    const result = await pipe(stack(EMPTY_REQUEST_W), Effect.provideService(TestDepsW, TEST_DEPS), Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 200,
      headers: {
        QUX: 'qux_value',
      },
      body: JSON.stringify({ foo: 'foo_value' }),
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an success case with string body', async () => {
    const stack = pipe(testCoreR(TEST_OUT_2), unit.middleware());
    const result = await pipe(stack(EMPTY_REQUEST_W), Effect.provideService(TestDepsW, TEST_DEPS), Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 200,
      headers: {
        QUX: 'qux_value',
      },
      body: 'string body',
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  it('should work as expected in an error case', async () => {
    const stack = pipe(testCoreL(TEST_OUT_3), unit.middleware());
    const result = await pipe(stack(EMPTY_REQUEST_W), Effect.provideService(TestDepsW, TEST_DEPS), Effect.runPromise);

    expect(result).toStrictEqual({
      statusCode: 409,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'SomeError: Some Error Message', statusCode: 409 }),
    });
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
