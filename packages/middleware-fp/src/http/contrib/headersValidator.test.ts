import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../request.js';
import * as unit from './headersValidator.js';

export const testSchema = Schema.Struct({
  foo: Schema.Literal('foo_value'),
  'content-type': Schema.Literal('application/json'),
  num: Schema.NumberFromString,
});

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, {
  headers: { foo: 'foo_value', 'content-type': 'application/json', num: '123' },
});
const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, {
  headers: { foo: 'foo_value', 'content-type': 'text/xml' },
});
const TEST_IN_3: any = {};

describe('middleware/headers-validator', () => {
  it('should work as expected with valid data', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_1), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: {
        'content-type': 'application/json',
        foo: 'foo_value',
        num: 123,
      },
      in: {
        url: '/',
        method: 'GET',
        pathParameters: {},
        queryStringParameters: {},
        headers: {
          'content-type': 'application/json',
          foo: 'foo_value',
          num: 123,
        },
        headersValidatorRaw: {
          'content-type': 'application/json',
          foo: 'foo_value',
          num: '123',
        },
      },
    });
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);
    await expect(result).rejects.toThrow('Expected "application/json", actual "text/xml"');
  });

  it('should work as expected with invalid data', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN_3), Effect.runPromise);
    await expect(result).rejects.toThrow(
      'Expected { readonly foo: "foo_value"; readonly content-type: "application/json"; readonly num: NumberFromString }, actual undefined'
    );
  });
});
