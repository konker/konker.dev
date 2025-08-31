import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { echoCoreIn200W } from '../../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../../request.js';
import * as unit from './index.js';

const TEST_IN = makeRequestW(EMPTY_REQUEST_W, {
  headers: { FOO: 'foo_value' },
});

describe('middleware/headers-normalizer', () => {
  it('should work as expected with default params', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: { Foo: 'foo_value' },
      in: {
        url: '/',
        method: 'GET',
        headers: { foo: 'foo_value' },
        headersNormalizerRequestRaw: { FOO: 'foo_value' },
        pathParameters: {},
        queryStringParameters: {},
      },
    });
  });

  it('should work as expected with un-normalized request param', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware({ normalizeRequestHeaders: false }));
    const result = pipe(egHandler(TEST_IN), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: { Foo: 'foo_value' },
      in: {
        url: '/',
        headers: { FOO: 'foo_value' },
        headersNormalizerRequestRaw: { FOO: 'foo_value' },
        method: 'GET',
        pathParameters: {},
        queryStringParameters: {},
      },
    });
  });

  it('should work as expected with un-normalized response params', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware({ normalizeResponseHeaders: false }));
    const result = pipe(egHandler(TEST_IN), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: { foo: 'foo_value' },
      in: {
        url: '/',
        headers: { foo: 'foo_value' },
        headersNormalizerRequestRaw: { FOO: 'foo_value' },
        method: 'GET',
        pathParameters: {},
        queryStringParameters: {},
      },
    });
  });
});
