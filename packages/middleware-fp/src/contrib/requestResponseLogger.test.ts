import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import type { MockInstance } from 'vitest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Handler } from '../index';
import { TestDeps } from '../test/test-common';
import * as unit from './requestResponseLogger';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('effect/Effect', { spy: true });

type In = { foo: 'foo' };
type Out = { qux: 'qux' };

const TEST_IN: In = { foo: 'foo' } as const;
const TEST_OUT: Out = { qux: 'qux' } as const;
const TEST_DEPS: TestDeps = { bar: 'bar' };

const testCore: Handler<any, Out, Error, TestDeps> = (_) => Effect.succeed(TEST_OUT);

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
    const result = await pipe(stack(TEST_IN), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);

    expect(result).toStrictEqual({
      qux: 'qux',
    });
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenNthCalledWith(1, '[requestResponseLogger] REQUEST', TEST_IN);
    expect(logSpy).toHaveBeenNthCalledWith(2, '[requestResponseLogger] RESPONSE', TEST_OUT);
  });
});
