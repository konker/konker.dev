import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { describe, expect, it } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as helmetJsHeaders } from './helmetJsHeaders.js';

describe('helmetJsHeaders', () => {
  it('adds the default security headers', async () => {
    const { logger } = recordingLogger();
    const wrapped = helmetJsHeaders()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const result = await wrapped(sampleRequestW)({ logger });

    expect(result.isOk() && result.value.headers).toMatchObject({
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'X-Content-Type-Options': 'nosniff',
    });
  });
});
