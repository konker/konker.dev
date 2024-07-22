import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../index';
import { Deps } from '../test/test-common';
import * as unit from './request-response-logger';

type In = { foo: 'foo' };
type Out = { qux: 'qux' };

const TEST_IN: In = { foo: 'foo' } as const;
const TEST_OUT: Out = { qux: 'qux' } as const;
const TEST_DEPS: Deps = { bar: 'bar' };

const testCore: Handler<any, Out, Error, Deps> = (_) => P.Effect.succeed(TEST_OUT);

describe('middleware/response-request-logger', () => {
  let logSpy: jest.SpyInstance;

  beforeAll(() => {
    logSpy = jest.spyOn(P.Effect, 'logInfo').mockReturnValue(undefined as any);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should work as expected', async () => {
    const stack = P.pipe(testCore, unit.middleware);
    const result = await P.pipe(stack(TEST_IN), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);

    expect(result).toStrictEqual({
      qux: 'qux',
    });
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy.mock.calls[0][0]).toBe('[request-response-logger] REQUEST');
    expect(logSpy.mock.calls[0][1]).toStrictEqual(TEST_IN);
    expect(logSpy.mock.calls[1][0]).toBe('[request-response-logger] RESPONSE');
    expect(logSpy.mock.calls[1][1]).toStrictEqual(TEST_OUT);
  });
});
