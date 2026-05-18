import { describe, expect, it } from 'vitest';

import { ERROR_TAG, isMiddlewareError, middlewareError, toMiddlewareError } from './MiddlewareError.js';

describe('MiddlewareError', () => {
  it('constructs with message only', () => {
    const e = middlewareError('boom');
    expect(e).toEqual({ _tag: ERROR_TAG, message: 'boom' });
  });

  it('constructs with internal', () => {
    const e = middlewareError('boom', ['ctx']);
    expect(e).toEqual({ _tag: ERROR_TAG, message: 'boom', internal: ['ctx'] });
  });

  describe('isMiddlewareError', () => {
    it('recognises a MiddlewareError', () => {
      expect(isMiddlewareError(middlewareError('x'))).toBe(true);
    });

    it('rejects non-objects', () => {
      expect(isMiddlewareError('x')).toBe(false);
      expect(isMiddlewareError(null)).toBe(false);
      expect(isMiddlewareError(undefined)).toBe(false);
      expect(isMiddlewareError(42)).toBe(false);
    });

    it('rejects objects without the tag', () => {
      expect(isMiddlewareError({ message: 'x' })).toBe(false);
      expect(isMiddlewareError({ _tag: 'OtherError' })).toBe(false);
    });
  });

  describe('toMiddlewareError', () => {
    it('preserves MiddlewareError and nests it under internal', () => {
      const original = middlewareError('inner', ['ctx']);
      const wrapped = toMiddlewareError(original);
      expect(wrapped.message).toBe('inner');
      expect(wrapped.internal).toEqual([original, 'ctx']);
    });

    it('overrides message when provided', () => {
      const wrapped = toMiddlewareError(middlewareError('inner'), 'outer');
      expect(wrapped.message).toBe('outer');
    });

    it('wraps an Error', () => {
      const err = new Error('boom');
      const wrapped = toMiddlewareError(err);
      expect(wrapped.message).toBe('boom');
      expect(wrapped.internal).toEqual([err]);
    });

    it('wraps a string', () => {
      const wrapped = toMiddlewareError('boom');
      expect(wrapped.message).toBe('boom');
      expect(wrapped.internal).toEqual(['boom']);
    });

    it('falls back to "Internal Server Error" for unknown shapes', () => {
      const wrapped = toMiddlewareError({ random: 'thing' });
      expect(wrapped.message).toBe('Internal Server Error');
    });
  });
});
