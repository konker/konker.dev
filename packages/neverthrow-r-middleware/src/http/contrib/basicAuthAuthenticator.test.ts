import { errR, okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import * as helpers from '@konker.dev/neverthrow-r-auth-utils/helpers';
import { describe, expect, it, vi } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { makeRequestW } from '../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as basicAuthAuthenticator } from './basicAuthAuthenticator.js';

describe('basicAuthAuthenticator', () => {
  const validAuthorization = 'Basic dXNlcjA6c2VjcmV0LTA=';
  const invalidAuthorization = 'Basic dXNlcjA6YmFkLXNlY3JldA==';

  it('authenticates valid credentials', async () => {
    const { logger } = recordingLogger();
    const wrapped = basicAuthAuthenticator()((req) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: req.userId,
      } as ResponseW)
    );
    const input = makeRequestW(sampleRequestW, {
      headers: { authorization: validAuthorization },
      headersNormalizerRequestRaw: { Authorization: validAuthorization },
    });
    const result = await wrapped(input)({
      logger,
      validBasicAuthCredentialSet: [{ username: 'user0', passwords: ['secret-0'] }],
    });

    expect(result.isOk() && result.value.body).toBe('user0');
  });

  it('returns a 401 HttpApiError for invalid credentials', async () => {
    const { logger } = recordingLogger();
    const wrapped = basicAuthAuthenticator()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, {
      headers: { authorization: invalidAuthorization },
      headersNormalizerRequestRaw: { Authorization: invalidAuthorization },
    });
    const result = await wrapped(input)({
      logger,
      validBasicAuthCredentialSet: [{ username: 'user0', passwords: ['secret-0'] }],
    });

    expect(result.isErr() && result.error.statusCode).toBe(401);
  });

  it('returns a 401 HttpApiError when the auth header is missing', async () => {
    const { logger } = recordingLogger();
    const wrapped = basicAuthAuthenticator()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, {
      headers: {},
      headersNormalizerRequestRaw: {},
    });
    const result = await wrapped(input)({
      logger,
      validBasicAuthCredentialSet: [{ username: 'user0', passwords: ['secret-0'] }],
    });

    expect(result.isErr() && result.error.statusCode).toBe(401);
  });

  it('stringifies non-Error auth extraction failures', async () => {
    vi.spyOn(helpers, 'extractBasicAuthHeaderValue').mockReturnValue(errR<any>('boom'));
    const { logger } = recordingLogger();
    const wrapped = basicAuthAuthenticator()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const result = await wrapped(makeRequestW(sampleRequestW, { headers: {}, headersNormalizerRequestRaw: {} }))({
      logger,
      validBasicAuthCredentialSet: [{ username: 'user0', passwords: ['secret-0'] }],
    });

    expect(result.isErr() && result.error.message).toContain('boom');
  });
});
