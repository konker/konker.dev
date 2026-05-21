import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { pipe } from '@konker.dev/neverthrow-r/pipe';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, expect, it } from 'vitest';

import { middleware as apiGatewayProxyEventV2Adapter } from '../http/contrib/apiGatewayProxyEventV2Adapter.js';
import { middleware as bodyValidator } from '../http/contrib/bodyValidator.js';
import { middleware as jsonBodyParserRequest } from '../http/contrib/jsonBodyParserRequest.js';
import { middleware as jsonBodySerializerResponse } from '../http/contrib/jsonBodySerializerResponse.js';
import type { RequestW } from '../http/RequestW.js';
import { EMPTY_RESPONSE_W, makeResponseW, type ResponseW } from '../http/ResponseW.js';
import { recordingLogger } from './test-common.js';

// --- fixture validator ---------------------------------------------------

type Payload = { name: string };

const payloadSchema: StandardSchemaV1<unknown, Payload> = {
  '~standard': {
    version: 1,
    vendor: 'fixture',
    validate(input) {
      if (typeof input === 'object' && input !== null && typeof (input as { name?: unknown }).name === 'string') {
        return { value: { name: (input as { name: string }).name } };
      }
      return { issues: [{ message: 'expected { name: string }' }] };
    },
  },
};

// --- fixture API Gateway events -----------------------------------------

function fixtureEvent(body: string): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'POST /greet',
    rawPath: '/greet',
    rawQueryString: '',
    headers: { 'content-type': 'application/json' },
    queryStringParameters: undefined,
    pathParameters: undefined,
    requestContext: {
      accountId: '123',
      apiId: 'abc',
      domainName: 'example.com',
      domainPrefix: 'example',
      http: {
        method: 'POST',
        path: '/greet',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'integration-test',
      },
      requestId: 'req-1',
      routeKey: 'POST /greet',
      stage: '$default',
      time: '1/Jan/2026:00:00:00 +0000',
      timeEpoch: 0,
    },
    body,
    isBase64Encoded: false,
  } as unknown as APIGatewayProxyEventV2;
}

// --- inner handler -------------------------------------------------------
//
// Sees a request whose body has already been parsed and validated and emits
// a structured response body — the serializer downstream will JSON-stringify
// it.

type InnerOutput = { readonly body: { readonly greeting: string } };

function innerHandler(req: RequestW<{ body: Payload }>) {
  return okAsyncR<ResponseW<InnerOutput>>(
    makeResponseW(EMPTY_RESPONSE_W, { body: { greeting: `hello, ${req.body.name}!` } })
  );
}

// --- composed stack ------------------------------------------------------
//
// Outermost is the adapter (raw event in / proxy result out). Inside that
// the serializer turns the inner structured response body into a string.
// Then the parser converts the incoming string body to `unknown`, and the
// validator narrows it to Payload before the inner handler runs.

const stack = pipe(
  innerHandler,
  bodyValidator(payloadSchema),
  jsonBodyParserRequest(),
  jsonBodySerializerResponse(),
  apiGatewayProxyEventV2Adapter()
);

describe('integration: adapter → serializer → parser → validator → inner', () => {
  it('round-trips a JSON request/response through the full stack', async () => {
    const { logger } = recordingLogger();
    const result = await stack(fixtureEvent('{"name":"world"}'))({ logger });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.statusCode).toBe(200);
      expect(JSON.parse(result.value.body)).toEqual({ greeting: 'hello, world!' });
    }
  });

  it('fails with a MiddlewareError when the body is not valid JSON', async () => {
    const { logger } = recordingLogger();
    const result = await stack(fixtureEvent('not json'))({ logger });
    expect(result.isErr() && result.error.message).toBe('Invalid JSON');
  });

  it('fails with a MiddlewareError when the body fails validation', async () => {
    const { logger } = recordingLogger();
    const result = await stack(fixtureEvent('{"name":42}'))({ logger });
    expect(result.isErr() && result.error.message).toBe('Body validation failed');
  });
});
