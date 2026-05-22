import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { describe, expect, it } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { makeRequestW, type RequestW } from '../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as jsonBodyParserRequest, type WithParsedBody } from './jsonBodyParserRequest.js';

describe('jsonBodyParserRequest', () => {
  it('parses a JSON body and forwards it to the wrapped handler', async () => {
    const { logger } = recordingLogger();
    const wrapped = jsonBodyParserRequest()((req: RequestW<WithParsedBody>) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: req.body,
      } as ResponseW)
    );
    const input = makeRequestW(sampleRequestW, { body: '{"a":1}' });
    const result = await wrapped(input)({ logger });
    expect(result.isOk() && (result.value as { body?: unknown }).body).toEqual({
      a: 1,
    });
  });

  it('passes undefined through when there is no body', async () => {
    const { logger } = recordingLogger();
    const wrapped = jsonBodyParserRequest()((req: RequestW<WithParsedBody>) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: req.body,
      } as ResponseW)
    );
    const result = await wrapped(sampleRequestW)({ logger });
    expect(result.isOk() && (result.value as { body?: unknown }).body).toBeUndefined();
  });

  it('fails with a MiddlewareError on invalid JSON', async () => {
    const { logger } = recordingLogger();
    const wrapped = jsonBodyParserRequest()((_req) => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, { body: 'not json' });
    const result = await wrapped(input)({ logger });
    expect(result.isErr() && result.error.message).toBe('Invalid JSON');
  });
});
