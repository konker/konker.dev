import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, expect, it } from 'vitest';

import { recordingLogger } from '../../test/test-common.js';
import type { StrBodyRec } from '../RequestResponseHandler.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../ResponseW.js';

type StrResponseW = ResponseW<StrBodyRec>;
import {
  adaptFromApiGatewayProxyEventV2,
  adaptToApiGatewayProxyResult,
  middleware as apiGatewayProxyEventV2Adapter,
} from './apiGatewayProxyEventV2Adapter.js';

const sampleEvent: APIGatewayProxyEventV2 = {
  version: '2.0',
  routeKey: 'GET /hello',
  rawPath: '/hello',
  rawQueryString: 'a=1',
  headers: { 'x-test': 'yes', missing: undefined },
  queryStringParameters: { a: '1' },
  pathParameters: undefined,
  requestContext: {
    accountId: '123',
    apiId: 'abc',
    domainName: 'example.com',
    domainPrefix: 'example',
    http: {
      method: 'GET',
      path: '/hello',
      protocol: 'HTTP/1.1',
      sourceIp: '127.0.0.1',
      userAgent: 'test',
    },
    requestId: 'req',
    routeKey: 'GET /hello',
    stage: '$default',
    time: '1/Jan/2026:00:00:00 +0000',
    timeEpoch: 0,
  },
  isBase64Encoded: false,
} as unknown as APIGatewayProxyEventV2;

describe('apiGatewayProxyEventV2Adapter', () => {
  describe('adaptFromApiGatewayProxyEventV2', () => {
    it('flattens an event into a RequestW with sanitised records', () => {
      const req = adaptFromApiGatewayProxyEventV2(sampleEvent);
      expect(req.url).toBe('/hello');
      expect(req.method).toBe('GET');
      expect(req.body).toBe('');
      expect(req.headers).toEqual({ 'x-test': 'yes', missing: '' });
      expect(req.queryStringParameters).toEqual({ a: '1' });
      expect(req.pathParameters).toEqual({});
      expect(req.apiGatewayProxyEventV2Raw).toBe(sampleEvent);
    });
  });

  describe('adaptToApiGatewayProxyResult', () => {
    it('flattens a ResponseW back into a proxy result', () => {
      const res = adaptToApiGatewayProxyResult({
        ...EMPTY_RESPONSE_W,
        body: 'hi',
      } as StrResponseW);
      expect(res).toEqual({ statusCode: 200, body: 'hi', headers: {} });
    });

    it('falls back to empty body when body is missing', () => {
      const res = adaptToApiGatewayProxyResult(EMPTY_RESPONSE_W as StrResponseW);
      expect(res.body).toBe('');
    });
  });

  describe('middleware', () => {
    it('round-trips an event through a wrapped handler', async () => {
      const { logger } = recordingLogger();
      const wrapped = apiGatewayProxyEventV2Adapter()((_req) =>
        okAsyncR<StrResponseW>({
          ...EMPTY_RESPONSE_W,
          body: 'hello',
        } as StrResponseW)
      );
      const result = await wrapped(sampleEvent)({ logger });
      expect(result.isOk() && result.value).toEqual({
        statusCode: 200,
        body: 'hello',
        headers: {},
      });
    });
  });
});
