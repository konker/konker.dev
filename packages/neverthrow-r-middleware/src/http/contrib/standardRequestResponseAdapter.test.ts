import { text } from 'node:stream/consumers';

import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { describe, expect, it } from 'vitest';

import { recordingLogger } from '../../test/test-common.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import {
  adaptFromStandardRequest,
  adaptToStandardResponse,
  middleware as standardRequestResponseAdapter,
} from './standardRequestResponseAdapter.js';

describe('standardRequestResponseAdapter', () => {
  it('adapts a Request into a RequestW', async () => {
    const request = new Request('https://example.com/test?foo=bar', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'hello',
    });
    const result = await adaptFromStandardRequest(request);

    expect(result.isOk() && result.value).toMatchObject({
      url: 'https://example.com/test?foo=bar',
      method: 'POST',
      body: 'hello',
      headers: { 'content-type': 'application/json' },
      queryStringParameters: { foo: 'bar' },
    });
  });

  it('adapts a ResponseW into a Response', async () => {
    const result = await adaptToStandardResponse({
      ...EMPTY_RESPONSE_W,
      statusCode: 201,
      headers: { 'Content-Type': 'text/plain' },
      body: 'created',
    });

    expect(result.isOk() && result.value.status).toBe(201);
    if (result.isOk()) {
      expect(await text(result.value.body!)).toBe('created');
    }
  });

  it('handles a request-like object without headers', async () => {
    const request = {
      url: 'https://example.com/test',
      method: 'GET',
      headers: undefined,
      text: async () => '',
    } as unknown as Request;
    const result = await adaptFromStandardRequest(request);

    expect(result.isOk() && result.value.headers).toEqual({});
  });

  it('handles undefined body and headers when adapting to a Response', async () => {
    const result = await adaptToStandardResponse({
      statusCode: 404,
      headers: {},
      body: undefined,
    } as unknown as ResponseW<{ body?: string }>);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.status).toBe(404);
      expect(await text(result.value.body!)).toBe('');
      expect(Object.fromEntries(result.value.headers.entries())).toEqual({});
    }
  });

  it('handles undefined headers when adapting to a Response', async () => {
    const result = await adaptToStandardResponse({
      statusCode: 204,
      headers: undefined,
      body: '',
    } as unknown as ResponseW<{ body?: string }>);

    expect(result.isErr()).toBe(true);
  });

  it('runs end-to-end through the middleware', async () => {
    const { logger } = recordingLogger();
    const wrapped = standardRequestResponseAdapter()((req) =>
      okAsyncR<ResponseW<{ body: string }>>({
        ...EMPTY_RESPONSE_W,
        headers: req.headers,
        body: req.body ?? '',
      })
    );
    const result = await wrapped(
      new Request('https://example.com/test?foo=bar', {
        method: 'POST',
        headers: { authorization: 'Bearer token' },
        body: 'payload',
      })
    )({ logger });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.status).toBe(200);
      expect(await text(result.value.body!)).toBe('payload');
    }
  });
});
