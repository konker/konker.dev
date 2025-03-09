import * as Effect from 'effect/Effect';
import type { MockInstance } from 'vitest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { fetchEffect } from '../index.js';
import { DecodeStringResponseBodyMiddleware } from './decode-string-response-body-middleware.js';
import * as unit from './encode-json-request-body-middleware.js';

describe('tiny-fetch-fp', () => {
  let fetchMock: MockInstance;

  describe('EncodeJsonRequestBodyMiddleware', () => {
    const TEST_RESPONSE_BODY_JSON = '{ "val": "BANANA" }';
    const TEST_REQUEST_BODY = { foo: 'abc' };
    const TEST_REQUEST_BODY_JSON = JSON.stringify(TEST_REQUEST_BODY);

    beforeAll(() => {
      fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        text: async () => TEST_RESPONSE_BODY_JSON,
      } as never);
    });
    afterEach(vi.clearAllMocks);
    afterAll(vi.restoreAllMocks);

    // Wraps a fetchEffect function with a decoded string body
    const underTest = unit.EncodeJsonRequestBodyMiddleware(DecodeStringResponseBodyMiddleware(fetchEffect));

    it('should call fetch and decode the body string in the success case', async () => {
      const actual = await Effect.runPromise(
        underTest('https://example.com/', {
          bodyObject: TEST_REQUEST_BODY,
        })
      );
      expect(actual.status).toEqual(200);
      expect(actual.bodyString).toEqual(TEST_RESPONSE_BODY_JSON);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith('https://example.com/', {
        bodyObject: TEST_REQUEST_BODY,
        body: TEST_REQUEST_BODY_JSON,
      });
    });

    it('should call fetch and decode the body string in the success case with default init', async () => {
      const actual = async () => Effect.runPromise(underTest('https://example.com/'));
      await expect(actual).rejects.toThrow('Expected string, actual undefined');
      expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it('should call fetch and decode the body string in the error case', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Boom!'));

      const actual = () =>
        Effect.runPromise(
          underTest('https://example.com/', {
            bodyObject: TEST_REQUEST_BODY,
          })
        );
      await expect(actual).rejects.toThrow('Boom!');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
