import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../request.js';
import * as unit from './pathParametersValidator.js';

export const testSchema = Schema.Struct({
  foo: Schema.Literal('foo_value'),
  num: Schema.NumberFromString,
});

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, { pathParameters: { foo: 'foo_value', num: '123' } });
const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, { pathParameters: { foo: 'wam', num: '123' } });
const TEST_IN_3 = makeRequestW(EMPTY_REQUEST_W, {});

describe('middleware/path-parameters-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_1), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: {},
      in: {
        method: 'GET',
        headers: {},
        queryStringParameters: {},
        pathParametersValidatorRaw: { foo: 'foo_value', num: '123' },
        pathParameters: { foo: 'foo_value', num: 123 },
      },
    });
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);
    await expect(result).rejects.toThrow('{ readonly foo: "foo_value"; readonly num: NumberFromString }');
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_3), Effect.runPromise);
    await expect(result).rejects.toThrow('{ readonly foo: "foo_value"; readonly num: NumberFromString }');
  });
});
