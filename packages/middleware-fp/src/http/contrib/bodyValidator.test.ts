import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../request.js';
import * as unit from './bodyValidator.js';

export const testSchema = Schema.Struct({
  foo: Schema.Literal('foo_value'),
});

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, { body: { foo: 'foo_value' } });
const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, { body: { foo: 'wam' } });
const TEST_IN_3: any = {};

describe('middleware/body-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_1), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: { foo: 'foo_value' },
      headers: {},
      in: {
        body: {
          foo: 'foo_value',
        },
        bodyValidatorRaw: {
          foo: 'foo_value',
        },
        headers: {},
        method: 'GET',
        pathParameters: {},
        queryStringParameters: {},
      },
    });
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);
    await expect(result).rejects.toThrow('Expected "foo_value", actual "wam"');
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_3), Effect.runPromise);
    await expect(result).rejects.toThrow('Expected { readonly foo: "foo_value" }, actual undefined');
  });
});
