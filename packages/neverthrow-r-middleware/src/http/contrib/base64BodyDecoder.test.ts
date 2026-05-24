import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { describe, expect, it, vi } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { makeRequestW } from '../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as base64BodyDecoder } from './base64BodyDecoder.js';

describe('base64BodyDecoder', () => {
  it('decodes base64 when the predicate matches', async () => {
    const { logger } = recordingLogger();
    const wrapped = base64BodyDecoder(() => true)((req) =>
      okAsyncR({
        ...EMPTY_RESPONSE_W,
        body: req.body,
      } as ResponseW)
    );
    const input = makeRequestW(sampleRequestW, { body: Buffer.from('{"foo":"bar"}').toString('base64') });
    const result = await wrapped(input)({ logger });

    expect(result.isOk() && result.value.body).toBe('{"foo":"bar"}');
  });

  it('returns a MiddlewareError when decoding throws', async () => {
    const spy = vi.spyOn(Buffer, 'from').mockImplementation(() => {
      throw new Error('boom');
    });
    const { logger } = recordingLogger();
    const wrapped = base64BodyDecoder(() => true)(() => okAsyncR(EMPTY_RESPONSE_W));
    const result = await wrapped(makeRequestW(sampleRequestW, { body: 'abcd' }))({ logger });

    expect(result.isErr() && (result.error as { message: string }).message).toBe('boom');
    spy.mockRestore();
  });

  it('passes the request through unchanged when not base64 encoded', async () => {
    const { logger } = recordingLogger();
    const wrapped = base64BodyDecoder(() => false)((req) =>
      okAsyncR({
        ...EMPTY_RESPONSE_W,
        body: req.body,
      } as ResponseW)
    );
    const result = await wrapped(makeRequestW(sampleRequestW, { body: 'plain-text' }))({ logger });

    expect(result.isOk() && result.value.body).toBe('plain-text');
  });

  it('decodes an undefined body as an empty string when flagged as base64', async () => {
    const { logger } = recordingLogger();
    const wrapped = base64BodyDecoder(() => true)((req) =>
      okAsyncR({
        ...EMPTY_RESPONSE_W,
        body: req.body,
      } as ResponseW)
    );
    const result = await wrapped(sampleRequestW)({ logger });

    expect(result.isOk() && result.value.body).toBe('');
  });
});
