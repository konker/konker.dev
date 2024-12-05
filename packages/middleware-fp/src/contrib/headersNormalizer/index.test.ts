import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../../index';
import { TestDeps } from '../../test/test-common';
import * as unit from './index';

export type In = { headers: Record<string, string | undefined> };

const TEST_IN: In = { headers: { FOO: 'foo_value' } };
const TEST_DEPS: TestDeps = { bar: 'bar' };

export function _testCore<E, D extends TestDeps, I extends In>(i: I): P.Effect.Effect<D, E, any> {
  return P.pipe(
    TestDeps,
    P.Effect.flatMap((deps) =>
      P.Effect.succeed({
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
    const egHandler = P.pipe(testCore, unit.middleware());
    const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
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
    const egHandler = P.pipe(testCore, unit.middleware({ normalizeRequestHeaders: false }));
    const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
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
    const egHandler = P.pipe(testCore, unit.middleware({ normalizeResponseHeaders: false }));
    const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
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
