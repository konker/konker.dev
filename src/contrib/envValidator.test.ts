import * as P from '@konker.dev/effect-ts-prelude';

import { echoCoreIn } from '../test/test-common';
import * as unit from './envValidator';

export type In = { foo: 'foo' };

export const testSchema = P.Schema.Struct({
  qux: P.Schema.Literal('qux_value'),
  str: P.Schema.String,
  num: P.Schema.NumberFromString,
});

const TEST_IN: In = { foo: 'foo' };

describe('middleware/env-validator', () => {
  const OLD_ENV = process.env;
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should work as expected with valid data', async () => {
    process.env = { qux: 'qux_value', str: 'some-string', num: '123' };

    const egHandler = P.pipe(echoCoreIn, unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN), P.Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      foo: 'foo',
      validatedEnv: { qux: 'qux_value', str: 'some-string', num: 123 },
    });
  });

  it('should work as expected with invalid data', async () => {
    process.env = { noqux: 'noqux_value' };

    const egHandler = P.pipe(echoCoreIn, unit.middleware(testSchema));
    const result = P.pipe(egHandler(TEST_IN), P.Effect.runPromise);
    await expect(result).rejects.toThrow('is missing');
  });
});
