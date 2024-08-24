import * as P from '@konker.dev/effect-ts-prelude';

import { echoCoreInDeps, TestDeps } from '../test/test-common';
import * as unit from './identity';

export type In = { foo: 'foo' };
const TEST_IN: In = { foo: 'foo' };

const TEST_DEPS: TestDeps = TestDeps.of({ bar: 'bar' });

describe('middleware/identity', () => {
  it('should work as expected', async () => {
    const egHandler = P.pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({ foo: 'foo', bar: 'bar' });
  });
});
