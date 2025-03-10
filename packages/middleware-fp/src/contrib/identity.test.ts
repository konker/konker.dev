import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreInDeps, TestDeps } from '../test/test-common.js';
import * as unit from './identity.js';

export type In = { foo: 'foo' };
const TEST_IN: In = { foo: 'foo' };

const TEST_DEPS: TestDeps = TestDeps.of({ bar: 'bar' });

describe('middleware/identity', () => {
  it('should work as expected', async () => {
    const egHandler = pipe(echoCoreInDeps(TestDeps), unit.middleware());
    const result = pipe(egHandler(TEST_IN), Effect.provideService(TestDeps, TEST_DEPS), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({ foo: 'foo', bar: 'bar' });
  });
});
