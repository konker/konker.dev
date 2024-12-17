import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn } from '../test/test-common.js';
import * as unit from './bodyValidator.js';

export type In = { body: unknown };

export const testSchema = Schema.Struct({
  foo: Schema.Literal('foo_value'),
});

const TEST_IN_1: In = { body: { foo: 'foo_value' } };
const TEST_IN_2: In = { body: { foo: 'wam' } };
const TEST_IN_3: any = {};

describe('middleware/body-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = pipe(echoCoreIn, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_1), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      validatorRawBody: { foo: 'foo_value' },
      body: { foo: 'foo_value' },
    });
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = pipe(echoCoreIn, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);
    await expect(result).rejects.toThrow('Expected "foo_value", actual "wam"');
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = pipe(echoCoreIn, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_3), Effect.runPromise);
    await expect(result).rejects.toThrow('Expected { readonly foo: "foo_value" }, actual undefined');
  });
});
