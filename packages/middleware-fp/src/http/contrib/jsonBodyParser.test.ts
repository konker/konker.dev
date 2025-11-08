import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn200W } from '../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../RequestW.js';
import * as unit from './jsonBodyParser.js';

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, { body: '{"foo":"ABC"}' });
const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, { body: 'NOT_JSON' });

describe('middleware/json-body-parser', () => {
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
        jsonBodyParserRaw: '{"foo":"ABC"}',
        body: { foo: 'ABC' },
      },
    });
  });

  it('should work as expected with encodeResponseBody=false', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware({ encodeResponseBody: false }));
    const result = pipe(egHandler(TEST_IN_1), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: { foo: 'ABC' },
      headers: {},
      in: {
        url: '/',
        method: 'GET',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
        jsonBodyParserRaw: '{"foo":"ABC"}',
        body: { foo: 'ABC' },
      },
    });
  });

  it('should work as expected with bad body', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);
    await expect(result).rejects.toThrow('NOT_JSON');
  });

  it('should work as expected with missing body', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(EMPTY_REQUEST_W), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: '"OK"',
      headers: {},
      in: {
        url: '/',
        method: 'GET',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
        body: undefined,
        jsonBodyParserRaw: undefined,
      },
    });
  });
});
