import { errR, okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import * as helpers from '@konker.dev/neverthrow-r-auth-utils/helpers';
import { TEST_JWT_NOW_MS } from '@konker.dev/neverthrow-r-auth-utils/test/fixtures/jwt';
import { TEST_RSA_KEY_PUBLIC } from '@konker.dev/neverthrow-r-auth-utils/test/fixtures/test-jwt-rsa-keys';
import {
  TEST_TOKEN_RSA,
  TEST_TOKEN_RSA_STRING_PAYLOAD,
} from '@konker.dev/neverthrow-r-auth-utils/test/fixtures/test-jwt-tokens-rsa';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { makeRequestW } from '../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as jwtAuthenticatorRsa } from './jwtAuthenticatorRsa.js';

describe('jwtAuthenticatorRsa', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('authenticates a valid RSA JWT', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);
    const { logger } = recordingLogger();
    const wrapped = jwtAuthenticatorRsa()((req) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: req.userId,
      } as ResponseW)
    );
    const input = makeRequestW(sampleRequestW, {
      headers: { authorization: `Bearer ${TEST_TOKEN_RSA}` },
      headersNormalizerRequestRaw: { Authorization: `Bearer ${TEST_TOKEN_RSA}` },
    });
    const result = await wrapped(input)({
      logger,
      issuer: 'test-iss',
      rsaPublicKey: TEST_RSA_KEY_PUBLIC,
    });

    expect(result.isOk() && result.value.body).toBe('test-sub');
  });

  it('returns a 401 HttpApiError for an invalid RSA JWT', async () => {
    const { logger } = recordingLogger();
    const wrapped = jwtAuthenticatorRsa()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, {
      headers: { authorization: 'Bearer banana' },
      headersNormalizerRequestRaw: { Authorization: 'Bearer banana' },
    });
    const result = await wrapped(input)({
      logger,
      issuer: 'test-iss',
      rsaPublicKey: TEST_RSA_KEY_PUBLIC,
    });

    expect(result.isErr() && result.error.statusCode).toBe(401);
  });

  it('returns a 401 HttpApiError when the auth header is missing', async () => {
    const { logger } = recordingLogger();
    const wrapped = jwtAuthenticatorRsa()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, {
      headers: {},
      headersNormalizerRequestRaw: {},
    });
    const result = await wrapped(input)({
      logger,
      issuer: 'test-iss',
      rsaPublicKey: TEST_RSA_KEY_PUBLIC,
    });

    expect(result.isErr() && result.error.statusCode).toBe(401);
  });

  it('returns a 401 HttpApiError when RSA verification returns unverified', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);
    const { logger } = recordingLogger();
    const wrapped = jwtAuthenticatorRsa()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, {
      headers: { authorization: `Bearer ${TEST_TOKEN_RSA_STRING_PAYLOAD}` },
      headersNormalizerRequestRaw: { Authorization: `Bearer ${TEST_TOKEN_RSA_STRING_PAYLOAD}` },
    });
    const result = await wrapped(input)({
      logger,
      issuer: 'test-iss',
      rsaPublicKey: TEST_RSA_KEY_PUBLIC,
    });

    expect(result.isErr() && result.error.statusCode).toBe(401);
  });

  it('stringifies non-Error bearer extraction failures for RSA auth', async () => {
    vi.spyOn(helpers, 'extractBearerToken').mockReturnValue(errR<any>('boom'));
    const { logger } = recordingLogger();
    const wrapped = jwtAuthenticatorRsa()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const result = await wrapped(makeRequestW(sampleRequestW, { headers: {}, headersNormalizerRequestRaw: {} }))({
      logger,
      issuer: 'test-iss',
      rsaPublicKey: TEST_RSA_KEY_PUBLIC,
    });

    expect(result.isErr() && result.error.message).toContain('boom');
  });
});
