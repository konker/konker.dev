import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, describe, expect, it } from 'vitest';

import { echoCoreIn } from '../test/test-common';
import * as unit from './envValidator';

export type In = { foo: 'foo' };

export const testSchema = Schema.Struct({
  qux: Schema.Literal('qux_value'),
  str: Schema.String,
  num: Schema.NumberFromString,
});

const TEST_IN: In = { foo: 'foo' };

describe('middleware/env-validator', () => {
  const OLD_ENV = process.env;
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should work as expected with valid data', async () => {
    process.env = { qux: 'qux_value', str: 'some-string', num: '123' };

    const egHandler = pipe(echoCoreIn, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      foo: 'foo',
      validatedEnv: { qux: 'qux_value', str: 'some-string', num: 123 },
    });
  });

  it('should work as expected with invalid data', async () => {
    process.env = { noqux: 'noqux_value' };

    const egHandler = pipe(echoCoreIn, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN), Effect.runPromise);
    await expect(result).rejects.toThrow('is missing');
  });
});
