import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { describe, expect, it } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as jsonBodySerializerResponse } from './jsonBodySerializerResponse.js';

describe('jsonBodySerializerResponse', () => {
  it('serialises a structured body to a JSON string', async () => {
    const { logger } = recordingLogger();
    const wrapped = jsonBodySerializerResponse()(() =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: { hello: 'world' },
      } as ResponseW)
    );
    const result = await wrapped(sampleRequestW)({ logger });
    expect(result.isOk() && result.value.body).toBe('{"hello":"world"}');
  });

  it('produces an empty-string body when the response has no body', async () => {
    const { logger } = recordingLogger();
    const wrapped = jsonBodySerializerResponse()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const result = await wrapped(sampleRequestW)({ logger });
    expect(result.isOk() && result.value.body).toBe('');
  });

  it('fails with a MiddlewareError for circular references', async () => {
    const { logger } = recordingLogger();
    const circ: Record<string, unknown> = {};
    circ.self = circ;
    const wrapped = jsonBodySerializerResponse()(() =>
      okAsyncR<ResponseW>({ ...EMPTY_RESPONSE_W, body: circ } as ResponseW)
    );
    const result = await wrapped(sampleRequestW)({ logger });
    expect(result.isErr() && result.error.message).toBe('JSON stringify failed');
  });
});
