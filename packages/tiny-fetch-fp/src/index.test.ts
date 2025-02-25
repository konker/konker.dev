import * as Effect from 'effect/Effect';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FetchEffect } from './index.js';
import * as unit from './index.js';
import { DecodeJsonResponseBodyMiddleware } from './middleware/decode-json-response-body-middleware.js';
import { DecodeStringResponseBodyMiddleware } from './middleware/decode-string-response-body-middleware.js';
import { IdentityMiddleware } from './middleware/identity-middleware.js';

describe('tiny-fetch-fp', () => {
  let fetchMock: MockInstance;

  describe('fetchResult', () => {
    const TEST_BODY = '{ "val": "BANANA" }';

    beforeEach(() => {
      fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        text: async () => TEST_BODY,
      } as never);
    });
    afterEach(vi.restoreAllMocks);

    it('should call fetch in the success case', async () => {
      const actual = await Effect.runPromise(unit.fetchEffect('https://example.com/'));
      expect(actual.status).toEqual(200);
      expect(await actual.text()).toEqual(TEST_BODY);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should call fetch in the error case', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Boom!'));

      const actual = () => Effect.runPromise(unit.fetchEffect('https://example.com/'));
      await expect(actual).rejects.toThrow('Boom!');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('kitchen sink', () => {
    const TEST_BODY = '{ "val": "BANANA" }';
    let underTest: FetchEffect<any, any>;

    beforeEach(() => {
      fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        text: async () => TEST_BODY,
      } as never);

      underTest = DecodeJsonResponseBodyMiddleware(
        DecodeStringResponseBodyMiddleware(IdentityMiddleware(unit.fetchEffect))
      );
    });
    afterEach(vi.restoreAllMocks);

    it('should call fetch in the success case', async () => {
      const actual = await Effect.runPromise(
        underTest('https://example.com/', {
          method: 'PUT',
          body: 'some_body',
        })
      );
      expect(actual.status).toEqual(200);
      expect(actual.bodyString).toEqual(TEST_BODY);
      expect(actual.parsedBody).toStrictEqual({
        val: 'BANANA',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should call fetch in the error case', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Boom!'));

      const actual = () => Effect.runPromise(underTest('https://example.com/'));
      await expect(actual).rejects.toThrow('Boom!');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
