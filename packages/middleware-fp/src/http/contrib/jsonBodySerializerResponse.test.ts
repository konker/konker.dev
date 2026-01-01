import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn200W, echoCoreInStrict200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../RequestW.js';
import * as unit from './jsonBodySerializerResponse.js';

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, { body: { foo: 'ABC' } });
const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, { body: 'NOT_JSON' });

describe('middleware/json-body-serializer', () => {
  it('should work as expected with default params', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN_1), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: '{"foo":"ABC"}',
      headers: {},
      in: {
        url: '/',
        method: 'GET',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
        body: { foo: 'ABC' },
      },
    });
  });

  it('should work as expected with string body', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: '"NOT_JSON"',
      headers: {},
      in: {
        url: '/',
        method: 'GET',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
        body: 'NOT_JSON',
      },
    });
  });

  it('should work as expected with missing body', async () => {
    const egHandler = pipe(echoCoreInStrict200W, unit.middleware());
    const result = pipe(egHandler(EMPTY_REQUEST_W), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: '',
      headers: {},
      in: {
        url: '/',
        method: 'GET',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
      },
    });
  });
});
