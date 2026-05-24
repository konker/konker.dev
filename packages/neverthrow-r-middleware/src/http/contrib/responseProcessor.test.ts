import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { errAsync } from 'neverthrow';
import { describe, expect, it } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { HttpApiError } from '../HttpApiError.js';
import { EMPTY_RESPONSE_W } from '../ResponseW.js';
import { middleware as responseProcessor } from './responseProcessor.js';

describe('responseProcessor', () => {
  it('passes through a successful response', async () => {
    const { logger } = recordingLogger();
    const wrapped = responseProcessor()(() =>
      okAsyncR({
        ...EMPTY_RESPONSE_W,
        statusCode: 201,
        body: 'created',
      })
    );
    const result = await wrapped(sampleRequestW)({ logger });

    expect(result.isOk() && (result.value as { body?: string }).body).toBe('created');
  });

  it('converts HttpApiError failures into error responses', async () => {
    const { logger } = recordingLogger();
    const wrapped = responseProcessor()(
      () => () => errAsync(new HttpApiError({ statusCode: 409, message: 'Conflict' }))
    );
    const result = await wrapped(sampleRequestW)({ logger });

    expect(result.isOk() && result.value).toMatchObject({
      statusCode: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
