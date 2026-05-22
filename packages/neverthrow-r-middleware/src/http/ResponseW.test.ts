import { describe, expect, it } from 'vitest';

import { EMPTY_RESPONSE_W, makeResponseW } from './ResponseW.js';

describe('ResponseW', () => {
  it('EMPTY_RESPONSE_W has the expected default shape', () => {
    expect(EMPTY_RESPONSE_W).toEqual({ statusCode: 200, headers: {} });
  });

  describe('makeResponseW', () => {
    it('returns a shallow copy when called with one arg', () => {
      const copy = makeResponseW(EMPTY_RESPONSE_W);
      expect(copy).toEqual(EMPTY_RESPONSE_W);
      expect(copy).not.toBe(EMPTY_RESPONSE_W);
    });

    it('merges extra fields when called with two args', () => {
      const merged = makeResponseW(EMPTY_RESPONSE_W, {
        body: '{"ok":true}',
        statusCode: 201,
      });
      expect(merged.statusCode).toBe(201);
      expect((merged as { body?: string }).body).toBe('{"ok":true}');
    });
  });
});
