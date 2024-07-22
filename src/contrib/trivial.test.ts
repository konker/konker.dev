import * as P from '@konker.dev/effect-ts-prelude';

import { Deps, echoCoreInDeps } from '../test/test-common';
import * as unit from './trivial';

export type In = { foo: 'foo' };
const TEST_IN: In = { foo: 'foo' };

const TEST_DEPS: Deps = Deps.of({ bar: 'bar' });

describe('middleware/trivial', () => {
  it('should work as expected', async () => {
    const egHandler = P.pipe(echoCoreInDeps(Deps), unit.middleware());
    const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(Deps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({ foo: 'foo', bar: 'bar' });
  });
});
