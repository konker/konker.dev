import { describe, expect, it } from 'vitest';

import { EMPTY_REQUEST_W, makeRequestW } from './RequestW.js';

describe('RequestW', () => {
  it('EMPTY_REQUEST_W has the expected default shape', () => {
    expect(EMPTY_REQUEST_W).toEqual({
      url: '/',
      method: 'GET',
      headers: {},
      queryStringParameters: {},
      pathParameters: {},
    });
  });

  describe('makeRequestW', () => {
    it('returns a shallow copy when called with one arg', () => {
      const copy = makeRequestW(EMPTY_REQUEST_W);
      expect(copy).toEqual(EMPTY_REQUEST_W);
      expect(copy).not.toBe(EMPTY_REQUEST_W);
    });

    it('merges extra fields when called with two args', () => {
      const merged = makeRequestW(EMPTY_REQUEST_W, { body: 'hi', extra: 1 });
      expect(merged.body).toBe('hi');
      expect((merged as { extra: number }).extra).toBe(1);
    });
  });
});
