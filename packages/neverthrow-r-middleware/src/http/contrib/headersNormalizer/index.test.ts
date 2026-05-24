import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { describe, expect, it } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../../test/test-common.js';
import { makeRequestW } from '../../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../../ResponseW.js';
import { middleware as headersNormalizer } from './index.js';

describe('headersNormalizer', () => {
  it('normalizes request and response header casing by default', async () => {
    const { logger } = recordingLogger();
    const wrapped = headersNormalizer()((req) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        headers: req.headers,
      })
    );
    const input = makeRequestW(sampleRequestW, { headers: { FOO: 'bar' } });
    const result = await wrapped(input)({ logger });

    expect(result.isOk() && result.value.headers).toEqual({ Foo: 'bar' });
  });

  it('can skip request header normalization', async () => {
    const { logger } = recordingLogger();
    const wrapped = headersNormalizer({ normalizeRequestHeaders: false })((req) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: req.headers,
      } as ResponseW)
    );
    const input = makeRequestW(sampleRequestW, { headers: { FOO: 'bar' } });
    const result = await wrapped(input)({ logger });

    expect(result.isOk() && result.value.body).toEqual({ FOO: 'bar' });
  });

  it('can skip response header normalization', async () => {
    const { logger } = recordingLogger();
    const wrapped = headersNormalizer({ normalizeResponseHeaders: false })(() =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        headers: { foo: 'bar' },
      })
    );
    const result = await wrapped(sampleRequestW)({ logger });

    expect(result.isOk() && result.value.headers).toEqual({ foo: 'bar' });
  });
});
