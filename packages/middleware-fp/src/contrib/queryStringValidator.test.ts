import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { EMPTY_REQUEST_W, makeRequestW } from '../lib/http.js';
import { echoCoreIn200W } from '../test/test-common.js';
import * as unit from './queryStringValidator.js';

export const testSchema = Schema.Struct({
  foo: Schema.Literal('foo_value'),
  num: Schema.NumberFromString,
});

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, { queryStringParameters: { foo: 'foo_value', num: '123' } });
const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, { queryStringParameters: { foo: 'wam', num: '123' } });
const TEST_IN_3 = makeRequestW(EMPTY_REQUEST_W, {});

describe('middleware/query-string-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_1), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: {},
      in: {
        headers: {},
        method: 'GET',
        pathParameters: {},
        queryStringValidatorRaw: { foo: 'foo_value', num: '123' },
        queryStringParameters: { foo: 'foo_value', num: 123 },
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
