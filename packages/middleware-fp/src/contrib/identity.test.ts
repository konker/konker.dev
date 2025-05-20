import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { EMPTY_REQUEST_W } from '../lib/http.js';
import { echoCoreIn200W, TestDepsW } from '../test/test-common.js';
import * as unit from './identity.js';

const TEST_DEPS: TestDepsW = TestDepsW.of({ bar: 'bar' });

describe('middleware/identity', () => {
  it('should work as expected', async () => {
    const egHandler = pipe(echoCoreIn200W, unit.middleware());
    const result = pipe(egHandler(EMPTY_REQUEST_W), Effect.provideService(TestDepsW, TEST_DEPS), Effect.runPromise);
    await expect(result).resolves.toStrictEqual({
      body: 'OK',
      headers: {},
      in: {
        headers: {},
        method: 'GET',
        pathParameters: {},
        queryStringParameters: {},
      },
      statusCode: 200,
    });
  });
});
