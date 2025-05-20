import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { EMPTY_REQUEST_W, makeRequestW } from '../lib/http.js';
import { echoCoreIn200W } from '../test/test-common.js';
import * as unit from './trivial.js';

const TEST_IN = makeRequestW(EMPTY_REQUEST_W, { foo: 'foo' });

describe('middleware/trivial', () => {
  it('should work as expected', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(TEST_IN), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      statusCode: 200,
      body: 'OK',
      headers: {},
      in: {
        method: 'GET',
        headers: {},
        pathParameters: {},
        queryStringParameters: {},
        foo: 'foo',
      },
    });
  });
});
