import { errR } from '@konker.dev/neverthrow-r/constructors';
import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { describe, expect, it, vi } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../../test/test-common.js';
import { HttpApiError } from '../../HttpApiError.js';
import { makeRequestW } from '../../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../../ResponseW.js';
import { middleware as headerSignatureAuthorizer } from './index.js';
import * as lib from './lib.js';

describe('headerSignatureAuthorizer', () => {
  it('authorizes when the signature matches the body', async () => {
    const { logger } = recordingLogger();
    const wrapped = headerSignatureAuthorizer()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, {
      body: 'payload',
      headers: { 'x-signature': 'b82fcb791acec57859b989b430a826488ce2e479fdf92326bd0a2e8375a42ba4' },
    });
    const result = await wrapped(input)({ logger, secret: 'secret', signatureHeaderName: 'x-signature' });

    expect(result.isOk()).toBe(true);
  });

  it('returns a 401 HttpApiError when the signature is invalid', async () => {
    const { logger } = recordingLogger();
    const wrapped = headerSignatureAuthorizer()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, {
      body: 'payload',
      headers: { 'x-signature': 'bad' },
    });
    const result = await wrapped(input)({ logger, secret: 'secret', signatureHeaderName: 'x-signature' });

    expect(result.isErr() && result.error.statusCode).toBe(401);
  });

  it('returns the validation error when signature calculation fails', async () => {
    vi.spyOn(lib, 'validateHeaderSignature').mockReturnValue(
      errR(new HttpApiError({ statusCode: 500, message: 'boom' }))
    );
    const { logger } = recordingLogger();
    const wrapped = headerSignatureAuthorizer()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const result = await wrapped(sampleRequestW)({ logger, secret: 'secret', signatureHeaderName: 'x-signature' });

    expect(result.isErr() && result.error.message).toBe('boom');
  });
});
