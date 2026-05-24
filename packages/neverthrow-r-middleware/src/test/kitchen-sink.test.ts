import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { middleware as base64BodyDecoder } from '../http/contrib/base64BodyDecoder.js';
import { middleware as basicAuthDecoder } from '../http/contrib/basicAuthDecoder.js';
import { middleware as bodyValidator } from '../http/contrib/bodyValidator.js';
import { middleware as envValidator } from '../http/contrib/envValidator.js';
import { middleware as headersNormalizer } from '../http/contrib/headersNormalizer/index.js';
import { middleware as headersValidator } from '../http/contrib/headersValidator.js';
import { middleware as helmetJsHeaders } from '../http/contrib/helmetJsHeaders.js';
import { middleware as jsonBodyParserRequest } from '../http/contrib/jsonBodyParserRequest.js';
import { middleware as pathParametersValidator } from '../http/contrib/pathParametersValidator.js';
import { middleware as queryStringValidator } from '../http/contrib/queryStringValidator.js';
import { EMPTY_REQUEST_W, makeRequestW, type RequestW } from '../http/RequestW.js';
import { EMPTY_RESPONSE_W, makeResponseW, type ResponseW } from '../http/ResponseW.js';
import { recordingLogger } from './test-common.js';

const envSchema = z.object({
  KITCHEN_SINK_ENV: z.literal('ready'),
});

const headerSchema = z.object({
  authorization: z.string().startsWith('Basic '),
  'x-base64': z.literal('1'),
});

const querySchema = z.object({
  foo: z.literal('bar'),
  page: z.coerce.number(),
});

const pathSchema = z.object({
  slug: z.literal('hello'),
});

const bodySchema = z.object({
  name: z.literal('Konrad'),
});

function innerHandler(req: RequestW<any>) {
  return okAsyncR<ResponseW>(
    makeResponseW(EMPTY_RESPONSE_W, {
      body: {
        userId: req.userId,
        slug: req.pathParameters.slug,
        page: req.queryStringParameters.page,
        name: req.body.name,
        env: req.validatedEnv.KITCHEN_SINK_ENV,
      },
    })
  );
}

const stack: any = pipe(
  innerHandler,
  envValidator(envSchema),
  bodyValidator(bodySchema),
  jsonBodyParserRequest(),
  base64BodyDecoder((req) => req.headers['x-base64'] === '1'),
  queryStringValidator(querySchema),
  pathParametersValidator(pathSchema),
  headersValidator(headerSchema),
  basicAuthDecoder(),
  headersNormalizer(),
  helmetJsHeaders()
);

describe('integration: kitchen sink middleware stack', () => {
  it('runs a broad composed stack successfully', async () => {
    const oldEnv = process.env;
    process.env = { ...oldEnv, KITCHEN_SINK_ENV: 'ready' };
    const { logger } = recordingLogger();
    const request = makeRequestW(EMPTY_REQUEST_W, {
      headers: {
        Authorization: 'Basic dXNlcjA6c2VjcmV0LTA=',
        'X-Base64': '1',
      },
      queryStringParameters: { foo: 'bar', page: '2' },
      pathParameters: { slug: 'hello' },
      body: Buffer.from('{"name":"Konrad"}').toString('base64'),
    });

    const result = await stack(request)({ logger });
    process.env = oldEnv;

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(result.value.body).toEqual({
        userId: 'user0',
        slug: 'hello',
        page: 2,
        name: 'Konrad',
        env: 'ready',
      });
    }
  });
});
