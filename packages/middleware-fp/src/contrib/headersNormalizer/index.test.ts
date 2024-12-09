import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import type { Handler } from '../../index';
import { TestDeps } from '../../test/test-common';
import * as unit from './index';

export type In = { headers: Record<string, string | undefined> };

const TEST_IN: In = { headers: { FOO: 'foo_value' } };
const TEST_DEPS: TestDeps = { bar: 'bar' };

export function _testCore<E, D extends TestDeps, I extends In>(i: I): Effect.Effect<D, E, any> {
  return pipe(
    TestDeps,
    Effect.flatMap((deps) =>
      Effect.succeed({
        ...i,
        ...deps,
        headers: {
          ...i.headers,
          QUX: 'qux_value',
        },
      })
    )
  );
}
export const testCore: Handler<any, object, any, any> = _testCore;

describe('middleware/headers-normalizer', () => {
  it('should work as expected with default params', async () => {
    const egHandler = pipe(testCore, unit.middleware());
    const result = pipe(egHandler(TEST_IN), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      headers: {
        Foo: 'foo_value',
        Qux: 'qux_value',
      },
      normalizerRawInputHeaders: { FOO: 'foo_value' },
    });
  });

  it('should work as expected with un-normalized request param', async () => {
    const egHandler = pipe(testCore, unit.middleware({ normalizeRequestHeaders: false }));
    const result = pipe(egHandler(TEST_IN), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      headers: {
        Foo: 'foo_value',
        Qux: 'qux_value',
      },
      normalizerRawInputHeaders: { FOO: 'foo_value' },
    });
  });

  it('should work as expected with un-normalized response params', async () => {
    const egHandler = pipe(testCore, unit.middleware({ normalizeResponseHeaders: false }));
    const result = pipe(egHandler(TEST_IN), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      headers: {
        foo: 'foo_value',
        QUX: 'qux_value',
      },
      normalizerRawInputHeaders: { FOO: 'foo_value' },
    });
  });
});
