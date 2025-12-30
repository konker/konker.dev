/**
 * Validation Hash Helpers Tests
 */
import { describe, expect, it } from 'vitest';

import { computeHash } from './hash.js';

describe('computeHash', () => {
  it('produces deterministic hashes', () => {
    const value = { a: 1, b: { c: 2 } };
    expect(computeHash(value)).toBe(computeHash(value));
  });

  it('produces different hashes for different values', () => {
    expect(computeHash({ a: 1 })).not.toBe(computeHash({ a: 2 }));
  });

  it('hashes complex values safely', () => {
    const value: { [key: string]: unknown; self?: unknown } = {
      fn: () => 42,
      sym: Symbol('demo'),
      big: BigInt(10),
    };
    value.self = value;
    const hash = computeHash(value);
    expect(hash.startsWith('sha256:')).toBe(true);
  });
});
