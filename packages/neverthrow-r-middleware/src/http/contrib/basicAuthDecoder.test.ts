import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { describe, expect, it } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { makeRequestW } from '../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as basicAuthDecoder } from './basicAuthDecoder.js';

describe('basicAuthDecoder', () => {
  const authorization = 'Basic dXNlcjA6c2VjcmV0LTA=';

  it('extracts the userId from a valid basic auth header', async () => {
    const { logger } = recordingLogger();
    const wrapped = basicAuthDecoder()((req) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: req.userId,
      } as ResponseW)
    );
    const input = makeRequestW(sampleRequestW, {
      headers: { authorization },
      headersNormalizerRequestRaw: { Authorization: authorization },
    });
    const result = await wrapped(input)({ logger });

    expect(result.isOk() && result.value.body).toBe('user0');
  });

  it('returns a MiddlewareError when the header is missing', async () => {
    const { logger } = recordingLogger();
    const wrapped = basicAuthDecoder()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const result = await wrapped(
      makeRequestW(sampleRequestW, {
        headersNormalizerRequestRaw: {},
      })
    )({ logger });

    expect(result.isErr() && result.error.message).toBe('No token found');
  });
});
