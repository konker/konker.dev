import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { describe, expect, it } from 'vitest';

import { recordingLogger, sampleRequestW } from '../../test/test-common.js';
import { makeRequestW } from '../RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';
import { middleware as bodyValidator, type WithValidatedBody } from './bodyValidator.js';

const positiveNumberSchema: StandardSchemaV1<unknown, number> = {
  '~standard': {
    version: 1,
    vendor: 'fixture',
    validate(input) {
      if (typeof input === 'number' && input > 0) return { value: input };
      return { issues: [{ message: 'expected positive number' }] };
    },
  },
};

describe('bodyValidator', () => {
  it('forwards a validated body to the wrapped handler', async () => {
    const { logger } = recordingLogger();
    const wrapped = bodyValidator(positiveNumberSchema)((req: typeof sampleRequestW & WithValidatedBody<number>) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: { received: req.body },
      } as ResponseW)
    );
    const input = makeRequestW(sampleRequestW, { body: 42 });
    const result = await wrapped(input)({ logger });
    expect(result.isOk() && (result.value as { body?: { received: number } }).body).toEqual({ received: 42 });
  });

  it('fails with a MiddlewareError when validation fails', async () => {
    const { logger } = recordingLogger();
    const wrapped = bodyValidator(positiveNumberSchema)(() => okAsyncR<ResponseW>(EMPTY_RESPONSE_W));
    const input = makeRequestW(sampleRequestW, { body: -1 });
    const result = await wrapped(input)({ logger });
    expect(result.isErr() && result.error.message).toBe('Body validation failed');
  });

  it('supports schemas whose validate returns a Promise', async () => {
    const asyncSchema: StandardSchemaV1<unknown, string> = {
      '~standard': {
        version: 1,
        vendor: 'fixture',
        validate: async (input) =>
          typeof input === 'string' ? { value: input } : { issues: [{ message: 'expected string' }] },
      },
    };
    const { logger } = recordingLogger();
    const wrapped = bodyValidator(asyncSchema)((req: typeof sampleRequestW & WithValidatedBody<string>) =>
      okAsyncR<ResponseW>({
        ...EMPTY_RESPONSE_W,
        body: { received: req.body },
      } as ResponseW)
    );
    const input = makeRequestW(sampleRequestW, { body: 'hello' });
    const result = await wrapped(input)({ logger });
    expect(result.isOk() && (result.value as { body?: { received: string } }).body).toEqual({ received: 'hello' });
  });
});
