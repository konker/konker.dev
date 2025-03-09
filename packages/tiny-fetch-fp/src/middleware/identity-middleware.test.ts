import * as Effect from 'effect/Effect';
import type { MockInstance } from 'vitest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { fetchEffect } from '../index.js';
import * as unit from './identity-middleware.js';

describe('tiny-fetch-fp', () => {
  let fetchMock: MockInstance;

  describe('IdentityMiddleware', () => {
    const TEST_BODY = '{ "val": "BANANA" }';

    beforeAll(() => {
      fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 200,
        ok: true,
        text: async () => TEST_BODY,
      } as never);
    });
    afterEach(vi.clearAllMocks);
    afterAll(vi.restoreAllMocks);

    // Wraps the default fetchEffect function
    const underTest = unit.IdentityMiddleware(fetchEffect);

    it('should call fetch in the success case', async () => {
      const actual = await Effect.runPromise(underTest('https://example.com/'));
      expect(actual.status).toEqual(200);
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
