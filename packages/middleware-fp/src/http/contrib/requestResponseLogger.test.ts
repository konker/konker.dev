import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import type { MockInstance } from 'vitest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Handler } from '../../index.js';
import { TestDepsW } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, type RequestW } from '../request.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../response.js';
import * as unit from './requestResponseLogger.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

const TEST_DEPS: TestDepsW = { bar: 'bar' };

const testCore: Handler<RequestW, ResponseW, Error, TestDepsW> = (_) => Effect.succeed(EMPTY_RESPONSE_W);

describe('middleware/response-request-logger', () => {
  let logSpy: MockInstance;

  beforeAll(() => {
    logSpy = vi.spyOn(Effect, 'logInfo').mockReturnValue(undefined as any);
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should work as expected', async () => {
    const stack = pipe(testCore, unit.middleware());
    const result = await pipe(stack(EMPTY_REQUEST_W), Effect.provideService(TestDepsW, TEST_DEPS), Effect.runPromise);

    expect(result).toStrictEqual(EMPTY_RESPONSE_W);
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenNthCalledWith(1, '[requestResponseLogger] REQUEST', EMPTY_REQUEST_W);
    expect(logSpy).toHaveBeenNthCalledWith(2, '[requestResponseLogger] RESPONSE', EMPTY_RESPONSE_W);
  });
});
