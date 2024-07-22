import * as P from '@konker.dev/effect-ts-prelude';

import type { Handler } from '../../index';
import { Deps } from '../../test/test-common';
import * as unit from './index';

export type In = { headers: Record<string, string | undefined> };

const TEST_IN: In = { headers: { FOO: 'foo_value' } };
const TEST_DEPS: Deps = { bar: 'bar' };

export function _testCore<E, D extends Deps, I>(i: I): P.Effect.Effect<D, E, any> {
  return P.pipe(
    Deps,
    P.Effect.flatMap((deps) =>
      P.Effect.succeed({
        ...i,
        ...deps,
        headers: {
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
    const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      headers: { Qux: 'qux_value' },
      normalizedHeaders: { foo: 'foo_value' },
    });
  });

  it('should work as expected with un-normalized request param', async () => {
    const egHandler = P.pipe(testCore, unit.middleware({ normalizeRequestHeaders: false }));
    const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      headers: { Qux: 'qux_value' },
      normalizedHeaders: { FOO: 'foo_value' },
    });
  });

  it('should work as expected with un-normalized response params', async () => {
    const egHandler = P.pipe(testCore, unit.middleware({ normalizeResponseHeaders: false }));
    const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      headers: { QUX: 'qux_value' },
      normalizedHeaders: { foo: 'foo_value' },
    });
  });
});
