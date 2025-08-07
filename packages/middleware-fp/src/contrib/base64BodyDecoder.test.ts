import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EMPTY_REQUEST_W, makeRequestW } from '../lib/http.js';
import { echoCoreIn200W } from '../test/test-common.js';
import * as unit from './base64BodyDecoder.js';

const TEST_IN_1 = makeRequestW(EMPTY_REQUEST_W, { body: '{"foo":"ABC"}' });
const TEST_IN_2 = makeRequestW(EMPTY_REQUEST_W, { body: 'eyJmb28iOiJBQkMifQ==' });
const TEST_IN_3 = makeRequestW(EMPTY_REQUEST_W, {});

describe('middleware/base64-body-decoder', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should work as expected with un-encoded body', async () => {
    const egHandler = pipe(
      echoCoreIn200W,
      unit.middleware(() => false)
    );
    const result = pipe(egHandler(TEST_IN_1), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: '{"foo":"ABC"}',
      headers: {},
      in: {
        method: 'GET',
        body: '{"foo":"ABC"}',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
      },
    });
  });

  it('should work as expected with encoded body', async () => {
    const egHandler = pipe(
      echoCoreIn200W,
      unit.middleware(() => true)
    );
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: '{"foo":"ABC"}',
      headers: {},
      in: {
        method: 'GET',
        body: '{"foo":"ABC"}',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
      },
    });
  });

  it('should work as expected with error with missing body', async () => {
    const egHandler = pipe(
      echoCoreIn200W,
      unit.middleware(() => true)
    );
    const result = pipe(egHandler(TEST_IN_3), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: '',
      headers: {},
      in: {
        body: '',
        headers: {},
        method: 'GET',
        pathParameters: {},
        queryStringParameters: {},
      },
    });
  });

  it('should work as expected with error in decoding', async () => {
    vi.spyOn(Buffer, 'from').mockImplementation(() => {
      throw new Error('BOOM!');
    });
    const egHandler = pipe(
      echoCoreIn200W,
      unit.middleware(() => true)
    );
    const result = pipe(egHandler(TEST_IN_2), Effect.runPromise);
    await expect(result).rejects.toThrow('BOOM!');
  });
});
