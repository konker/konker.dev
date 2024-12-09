import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn } from '../test/test-common';
import * as unit from './queryStringValidator';

export type In = { queryStringParameters?: any };

export const testSchema = Schema.Struct({
  foo: Schema.Literal('foo_value'),
  num: Schema.NumberFromString,
});

const TEST_IN_1: In = { queryStringParameters: { foo: 'foo_value', num: '123' } };
const TEST_IN_2: In = { queryStringParameters: { foo: 'wam', num: '123' } };
const TEST_IN_3: In = {};

describe('middleware/query-string-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = pipe(echoCoreIn, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_1), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      validatorRawQueryStringParameters: { foo: 'foo_value', num: '123' },
      queryStringParameters: { foo: 'foo_value', num: 123 },
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
    await expect(result).rejects.toThrow(
      'Expected { readonly foo: "foo_value"; readonly num: NumberFromString }, actual undefined'
    );
  });
});
