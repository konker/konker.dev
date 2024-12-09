import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn } from '../test/test-common';
import * as unit from './headersValidator';

export type In = { headers: Record<string, string | undefined> };

export const testSchema = Schema.Struct({
  foo: Schema.Literal('foo_value'),
  'content-type': Schema.Literal('application/json'),
  num: Schema.NumberFromString,
});

const TEST_IN_1: In = { headers: { foo: 'foo_value', 'content-type': 'application/json', num: '123' } };
const TEST_IN_2: In = { headers: { foo: 'foo_value', 'content-type': 'text/xml' } };
const TEST_IN_3: any = {};

describe('middleware/headers-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = pipe(echoCoreIn, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_1), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      validatorRawHeaders: { foo: 'foo_value', 'content-type': 'application/json', num: '123' },
      headers: { foo: 'foo_value', 'content-type': 'application/json', num: 123 },
    });
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = pipe(echoCoreIn, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);
    await expect(result).rejects.toThrow('Expected "application/json", actual "text/xml"');
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = pipe(echoCoreIn, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_3), Effect.runPromise);
    await expect(result).rejects.toThrow(
      'Expected { readonly foo: "foo_value"; readonly content-type: "application/json"; readonly num: NumberFromString }, actual undefined'
    );
  });
});
