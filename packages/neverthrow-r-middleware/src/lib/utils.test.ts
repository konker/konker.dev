import { describe, expect, it } from 'vitest';

import { fromPromise, sanitizeRecord, tryJsonParse, tryJsonStringify } from './utils.js';

describe('sanitizeRecord', () => {
  it('returns an empty object for undefined', () => {
    expect(sanitizeRecord(undefined)).toEqual({});
  });

  it('replaces undefined values with empty strings', () => {
    expect(sanitizeRecord({ a: 'x', b: undefined })).toEqual({ a: 'x', b: '' });
  });
});

describe('fromPromise', () => {
  it('resolves to Ok on success', async () => {
    const result = await fromPromise(async () => Promise.resolve(42));
    expect(result.isOk() && result.value).toBe(42);
  });

  it('resolves to Err via toMiddlewareError on rejection', async () => {
    const result = await fromPromise(async () => Promise.reject(new Error('boom')));
    expect(result.isErr() && result.error.message).toBe('boom');
  });

  it('accepts a custom error mapper', async () => {
    const result = await fromPromise(
      async () => Promise.reject(new Error('boom')),
      () => ({ _tag: 'MiddlewareError' as const, message: 'mapped' })
    );
    expect(result.isErr() && result.error.message).toBe('mapped');
  });
});

describe('tryJsonParse', () => {
  it('parses valid JSON', () => {
    const result = tryJsonParse('{"a":1}');
    expect(result.isOk() && result.value).toEqual({ a: 1 });
  });

  it('returns Err for invalid JSON', () => {
    const result = tryJsonParse('not json');
    expect(result.isErr() && result.error.message).toBe('Invalid JSON');
  });
});

describe('tryJsonStringify', () => {
  it('stringifies a plain object', () => {
    const result = tryJsonStringify({ a: 1 });
    expect(result.isOk() && result.value).toBe('{"a":1}');
  });

  it('returns Err for a circular value', () => {
    const circ: Record<string, unknown> = {};
    circ.self = circ;
    const result = tryJsonStringify(circ);
    expect(result.isErr() && result.error.message).toBe('JSON stringify failed');
  });
});
