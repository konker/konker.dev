import { describe, expect, it } from 'vitest';

import { EMPTY_REQUEST_W } from '../../RequestW.js';
import { EMPTY_RESPONSE_W } from '../../ResponseW.js';
import { canonicalNormalizer, fromExceptionList, normalizeKeys, transformInput, transformOutput } from './lib.js';

describe('headersNormalizer/lib', () => {
  it('uses the exception list for canonical names', () => {
    expect(fromExceptionList('x-xss-protection')).toBe('X-XSS-Protection');
    expect(canonicalNormalizer('x-xss-protection')).toBe('X-XSS-Protection');
  });

  it('returns an empty record when normalizing undefined', () => {
    expect(normalizeKeys(undefined, (s) => s)).toEqual({});
  });

  it('stringifies non-string values while normalizing keys', () => {
    expect(normalizeKeys({ foo: 1, bar: true }, (s) => s.toUpperCase())).toEqual({ FOO: '1', BAR: 'true' });
  });

  it('stringifies undefined values as empty strings', () => {
    expect(normalizeKeys({ foo: undefined }, (s) => s)).toEqual({ foo: '' });
  });

  it('preserves raw request headers when request normalization is disabled', () => {
    const result = transformInput(false)({
      ...EMPTY_REQUEST_W,
      headers: { FOO: 'bar' },
    });

    expect(result.headers).toEqual({ FOO: 'bar' });
    expect(result.headersNormalizerRequestRaw).toEqual({ FOO: 'bar' });
  });

  it('preserves response header keys when response normalization is disabled', () => {
    const result = transformOutput(false)({
      ...EMPTY_RESPONSE_W,
      headers: { foo: 'bar' },
    });

    expect(result.headers).toEqual({ foo: 'bar' });
  });
});
