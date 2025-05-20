import { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { mockMomentoClientFactoryDeps } from '@konker.dev/momento-cache-client-effect/lib/test';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { EMPTY_REQUEST_W } from '../lib/http.js';
import { echoCoreInDepsW } from '../test/test-common.js';
import * as unit from './momentoClientInit.js';

describe('middleware/momento-client-init', () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    process.env = { MOMENTO_AUTH_TOKEN: 'MOMENTO_AUTH_TOKEN' };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should work as expected', async () => {
    const egHandler = pipe(echoCoreInDepsW(MomentoClientDeps), unit.middleware({}));

    const result = await pipe(egHandler(EMPTY_REQUEST_W), mockMomentoClientFactoryDeps(), Effect.runPromise);

    expect(result).toMatchObject({
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
    expect(result.deps).toHaveProperty('makeMomentoClient');
    // expect(clientFactoryMock).toHaveBeenCalledTimes(1);
  });
});
