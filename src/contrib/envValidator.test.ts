import * as P from '@konker.dev/effect-ts-prelude';

import { echoCoreInDeps, TestDeps } from '../test/test-common';
import * as unit from './envValidator';

export type In = { foo: 'foo' };

export const testSchema = P.Schema.Struct({
  qux: P.Schema.Literal('qux_value'),
});

const TEST_IN: In = { foo: 'foo' };
const TEST_DEPS: TestDeps = { bar: 'bar' };

describe('middleware/env-validator', () => {
  const OLD_ENV = process.env;
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should work as expected with valid data', async () => {
    process.env = { qux: 'qux_value' };

    const egHandler = P.pipe(echoCoreInDeps(TestDeps), unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      bar: 'bar',
      foo: 'foo',
      validatedEnv: { qux: 'qux_value' },
    });
  });

  it('should work as expected with invalid data', async () => {
    process.env = { noqux: 'noqux_value' };

    const egHandler = P.pipe(echoCoreInDeps(TestDeps), unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN), P.Effect.provideService(TestDeps, TEST_DEPS), P.Effect.runPromise);
    await expect(result).rejects.toThrow('is missing');
  });
});
