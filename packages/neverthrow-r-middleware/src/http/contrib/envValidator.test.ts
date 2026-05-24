import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as envValidator, type WithValidatedEnv } from './envValidator.js';

describe('envValidator', () => {
  const schema = z.object({
    TEST_ENV_VALUE: z.literal('hello'),
    TEST_ENV_NUM: z.coerce.number(),
  });

  it('injects validated env into the wrapped handler', async () => {
    const oldEnv = process.env;
    process.env = { ...oldEnv, TEST_ENV_VALUE: 'hello', TEST_ENV_NUM: '42' };
    const { logger } = recordingLogger();
    const wrapped = envValidator(schema)((req: { validatedEnv: { TEST_ENV_VALUE: string; TEST_ENV_NUM: number } }) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: req.validatedEnv,
      } as ResponseW)
    );

    const result = await wrapped(sampleRequestW)({ logger });
    process.env = oldEnv;

    expect(result.isOk() && result.value.body).toEqual({ TEST_ENV_VALUE: 'hello', TEST_ENV_NUM: 42 });
  });

  it('returns a MiddlewareError on invalid env', async () => {
    const oldEnv = process.env;
    process.env = { TEST_ENV_VALUE: 'bad' };
    const { logger } = recordingLogger();
    const wrapped = envValidator(schema)((_req: WithValidatedEnv<unknown>) => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));

    const result = await wrapped(sampleRequestW)({ logger });
    process.env = oldEnv;

    expect(result.isErr() && result.error.message).toBe('Environment validation failed');
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
    const wrapped = envValidator(schema)(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const result = await wrapped(sampleRequestW)({ logger });

    expect(result.isErr() && result.error.internal?.length).toBeGreaterThan(0);
  });
});
