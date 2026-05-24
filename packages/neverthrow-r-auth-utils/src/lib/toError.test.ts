import { describe, expect, it } from 'vitest';

import { toError } from './toError.js';

describe('toError', () => {
  it('returns Error instances unchanged', () => {
    const error = new Error('boom');
    expect(toError(error)).toBe(error);
  });

  it('converts non-Error values into Error instances', () => {
    const actual = toError('boom');
    expect(actual).toBeInstanceOf(Error);
    expect(actual.message).toBe('boom');
  });
});
