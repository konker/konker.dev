import { afterEach, describe, expect, it, vi } from 'vitest';

import { ERROR_TAG, HttpApiError, isHttpApiError, toErrorResponseW, toHttpApiError } from './HttpApiError.js';

describe('HttpApiError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('recognises HttpApiError instances and tagged objects', () => {
    expect(isHttpApiError(new HttpApiError({ statusCode: 400, message: 'bad' }))).toBe(true);
    expect(isHttpApiError({ _tag: ERROR_TAG })).toBe(true);
    expect(isHttpApiError({})).toBe(false);
  });

  it('wraps string inputs', () => {
    const error = toHttpApiError('boom');
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('boom');
    expect(error.internal).toEqual(['boom']);
  });

  it('wraps unknown inputs with the default message', () => {
    const error = toHttpApiError({ no: 'shape' });
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Internal Server Error');
  });

  it('overrides status and message when wrapping an Error', () => {
    const error = toHttpApiError(new Error('inner'), 401, 'outer');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('outer');
  });

  it('uses the original Error status defaults when no overrides are provided', () => {
    const error = toHttpApiError(new Error('inner'));
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('inner');
  });

  it('falls back when JSON stringification throws', () => {
    vi.spyOn(JSON, 'stringify').mockImplementation(() => {
      throw new Error('nope');
    });

    const response = toErrorResponseW(new HttpApiError({ statusCode: 418, message: 'teapot' }));

    expect(response).toEqual({
      statusCode: 418,
      headers: { 'Content-Type': 'application/json' },
      body: '{"message":"Internal Server Error","statusCode":500}',
    });
  });
});
