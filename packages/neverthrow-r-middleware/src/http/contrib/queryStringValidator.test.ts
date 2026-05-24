import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { makeRequestW } from '../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as queryStringValidator } from './queryStringValidator.js';

describe('queryStringValidator', () => {
  const schema = z.object({
    foo: z.literal('bar'),
    page: z.coerce.number(),
  });

  it('validates and replaces query string parameters', async () => {
    const { logger } = recordingLogger();
    const wrapped = queryStringValidator(schema)((req) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: req.queryStringParameters,
      } as ResponseW)
    );
    const input = makeRequestW(sampleRequestW, { queryStringParameters: { foo: 'bar', page: '3' } });
    const result = await wrapped(input)({ logger });

    expect(result.isOk() && result.value.body).toEqual({ foo: 'bar', page: 3 });
  });

  it('returns a MiddlewareError when query string validation fails', async () => {
    const { logger } = recordingLogger();
    const wrapped = queryStringValidator(schema)(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, { queryStringParameters: { foo: 'nope', page: '3' } });
    const result = await wrapped(input)({ logger });

    expect(result.isErr() && result.error.message).toBe('Query string validation failed');
  });

  it('keeps a thrown validator cause in internal details', async () => {
    const schema: StandardSchemaV1<unknown, string> = {
      '~standard': {
        version: 1,
        vendor: 'fixture',
        validate: () => {
          throw new Error('validator exploded');
        },
      },
    };
    const { logger } = recordingLogger();
    const wrapped = queryStringValidator(schema)(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const result = await wrapped(makeRequestW(sampleRequestW, { queryStringParameters: { foo: 'x' } }))({ logger });

    expect(result.isErr() && result.error.internal?.length).toBeGreaterThan(0);
  });
});
