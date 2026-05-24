import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { describe, expect, it } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { makeRequestW } from '../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as pathTokenAuthorizer } from './pathTokenAuthorizer.js';

describe('pathTokenAuthorizer', () => {
  it('authorizes when the path token matches the configured env var', async () => {
    const oldEnv = process.env;
    process.env = { ...oldEnv, TEST_SECRET_TOKEN: 'secret-token' };
    const { logger } = recordingLogger();
    const wrapped = pathTokenAuthorizer()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, { pathParameters: { token: 'secret-token' } });
    const result = await wrapped(input)({ logger, pathParamName: 'token', secretTokenEnvName: 'TEST_SECRET_TOKEN' });
    process.env = oldEnv;

    expect(result.isOk()).toBe(true);
  });

  it('returns a 401 HttpApiError when the token does not match', async () => {
    const oldEnv = process.env;
    process.env = { ...oldEnv, TEST_SECRET_TOKEN: 'secret-token' };
    const { logger } = recordingLogger();
    const wrapped = pathTokenAuthorizer()(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, { pathParameters: { token: 'bad-token' } });
    const result = await wrapped(input)({ logger, pathParamName: 'token', secretTokenEnvName: 'TEST_SECRET_TOKEN' });
    process.env = oldEnv;

    expect(result.isErr() && result.error.statusCode).toBe(401);
  });
});
