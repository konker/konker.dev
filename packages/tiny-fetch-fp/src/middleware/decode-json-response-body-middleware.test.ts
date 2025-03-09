import * as Effect from 'effect/Effect';
import type { MockInstance } from 'vitest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { fetchEffect } from '../index.js';
import * as unit from './decode-json-response-body-middleware.js';
import { DecodeStringResponseBodyMiddleware } from './decode-string-response-body-middleware.js';

describe('tiny-fetch-fp', () => {
  let fetchMock: MockInstance;

  describe('DecodeJsonResponseBodyMiddleware', () => {
    const TEST_BODY = '{ "val": "BANANA" }';
    const TEST_BODY_NON_JSON = 'not_json';

    beforeAll(() => {
      fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        text: async () => TEST_BODY,
      } as never);
    });
    afterEach(vi.clearAllMocks);
    afterAll(vi.restoreAllMocks);

    // Wraps a fetchEffect function with a decoded string body
    const underTest = unit.DecodeJsonResponseBodyMiddleware(DecodeStringResponseBodyMiddleware(fetchEffect));

    it('should call fetch and parse the JSON body in the success case', async () => {
      const actual = await Effect.runPromise(underTest('https://example.com/'));
      expect(actual.status).toEqual(200);
      expect(actual.bodyString).toEqual(TEST_BODY);
      expect(actual.parsedBody).toStrictEqual({
        val: 'BANANA',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should call fetch and parse the JSON body in the error case', async () => {
      fetchMock.mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: async () => TEST_BODY_NON_JSON,
      } as never);

      const actual = () => Effect.runPromise(underTest('https://example.com/'));
      await expect(actual).rejects.toThrow('"not_json" is not valid JSON');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
