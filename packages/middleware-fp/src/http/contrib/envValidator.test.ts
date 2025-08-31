import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, describe, expect, it } from 'vitest';

import { echoCoreIn200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../request.js';
import * as unit from './envValidator.js';

export const testSchema = Schema.Struct({
  qux: Schema.Literal('qux_value'),
  str: Schema.String,
  num: Schema.NumberFromString,
});

const TEST_IN = makeRequestW(EMPTY_REQUEST_W, { foo: 'foo' });

describe('middleware/env-validator', () => {
  const OLD_ENV = process.env;
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should work as expected with valid data', async () => {
    process.env = { qux: 'qux_value', str: 'some-string', num: '123' };

    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: {},
      in: {
        url: '/',
        method: 'GET',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
        foo: 'foo',
        validatedEnv: {
          num: 123,
          qux: 'qux_value',
          str: 'some-string',
        },
      },
    });
  });

  it('should work as expected with invalid data', async () => {
    process.env = { noqux: 'noqux_value' };

    const egHandler = pipe(echoCoreIn200W, unit.middleware(testSchema));
    const result = pipe(egHandler(TEST_IN), Effect.runPromise);
    await expect(result).rejects.toThrow('is missing');
  });
});
