import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { Hono, type HonoRequest } from 'hono';
import { describe, expect, it } from 'vitest';

import { recordingLogger } from '../../test/test-common.js';
import type { StrBodyRec } from '../RequestResponseHandler.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { adaptFromHonoRequest, adaptToHonoResponse, middleware as honoAdapter } from './honoAdapter.js';

type StrResponseW = ResponseW<StrBodyRec>;

async function makeHonoRequest(): Promise<HonoRequest> {
  // Use a minimal Hono app to obtain a real HonoRequest.
  const app = new Hono();
  let captured: HonoRequest | undefined;
  app.post('/echo/:id', (c) => {
    captured = c.req;
    return c.text('ok');
  });
  await app.request('/echo/42?q=1', {
    method: 'POST',
    headers: { 'x-test': 'yes' },
    body: 'hello',
  });
  if (!captured) throw new Error('no captured request');
  return captured;
}

describe('honoAdapter', () => {
  describe('adaptFromHonoRequest', () => {
    it('flattens a HonoRequest into a RequestW', async () => {
      const req = await makeHonoRequest();
      const result = await adaptFromHonoRequest(req);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.method).toBe('POST');
        expect(result.value.body).toBe('hello');
        expect(result.value.headers['x-test']).toBe('yes');
        expect(result.value.queryStringParameters.q).toBe('1');
        expect(result.value.pathParameters.id).toBe('42');
      }
    });
  });

  describe('adaptToHonoResponse', () => {
    it('produces a fetch Response from a ResponseW', async () => {
      const result = await adaptToHonoResponse({
        ...EMPTY_RESPONSE_W,
        body: 'hi',
      } as StrResponseW);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe(200);
        expect(await result.value.text()).toBe('hi');
      }
    });

    it('uses an empty body when none is provided', async () => {
      const result = await adaptToHonoResponse(EMPTY_RESPONSE_W as StrResponseW);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(await result.value.text()).toBe('');
    });
  });

  describe('middleware', () => {
    it('round-trips a HonoRequest through a wrapped handler', async () => {
      const { logger } = recordingLogger();
      const req = await makeHonoRequest();
      const wrapped = honoAdapter()((_r) =>
        okAsyncR<StrResponseW>({
          ...EMPTY_RESPONSE_W,
          body: 'pong',
        } as StrResponseW)
      );
      const result = await wrapped(req)({ logger });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.status).toBe(200);
        expect(await result.value.text()).toBe('pong');
      }
    });
  });
});
