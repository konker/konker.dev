import { errR, okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import * as helpers from '@konker.dev/neverthrow-r-auth-utils/helpers';
import { TEST_JWT_NOW_MS } from '@konker.dev/neverthrow-r-auth-utils/test/fixtures/jwt';
import {
  TEST_TOKEN,
  TEST_TOKEN_MISSING_SUBJECT,
} from '@konker.dev/neverthrow-r-auth-utils/test/fixtures/test-jwt-tokens';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { makeRequestW } from '../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as jwtDecoder } from './jwtDecoder.js';

describe('jwtDecoder', () => {
  const authorization = `Bearer ${TEST_TOKEN}`;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extracts the userId from a valid JWT', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);
    const { logger } = recordingLogger();
    const wrapped = jwtDecoder()((req) =>
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

    expect(result.isOk() && result.value.body).toBe('test-sub');
  });

  it('returns a 401 HttpApiError for an invalid JWT', async () => {
    const { logger } = recordingLogger();
    const wrapped = jwtDecoder()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, {
      headers: { authorization: 'Bearer banana' },
      headersNormalizerRequestRaw: { Authorization: 'Bearer banana' },
    });
    const result = await wrapped(input)({ logger });

    expect(result.isErr() && result.error.statusCode).toBe(401);
  });

  it('returns a 401 HttpApiError when the auth header is missing', async () => {
    const { logger } = recordingLogger();
    const wrapped = jwtDecoder()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, {
      headers: {},
      headersNormalizerRequestRaw: {},
    });
    const result = await wrapped(input)({ logger });

    expect(result.isErr() && result.error.statusCode).toBe(401);
  });

  it('returns userId undefined when the decoded token has no object sub', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);
    const { logger } = recordingLogger();
    const wrapped = jwtDecoder()((req) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: req.userId,
      } as ResponseW)
    );
    const input = makeRequestW(sampleRequestW, {
      headers: { authorization: `Bearer ${TEST_TOKEN_MISSING_SUBJECT}` },
      headersNormalizerRequestRaw: { Authorization: `Bearer ${TEST_TOKEN_MISSING_SUBJECT}` },
    });
    const result = await wrapped(input)({ logger });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.body).toBeUndefined();
    }
  });

  it('stringifies non-Error bearer extraction failures', async () => {
    vi.spyOn(helpers, 'extractBearerToken').mockReturnValue(errR<any>('boom'));
    const { logger } = recordingLogger();
    const wrapped = jwtDecoder()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const result = await wrapped(makeRequestW(sampleRequestW, { headers: {}, headersNormalizerRequestRaw: {} }))({
      logger,
    });

    expect(result.isErr() && result.error.message).toContain('boom');
  });
});
