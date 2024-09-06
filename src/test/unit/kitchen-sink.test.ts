/* eslint-disable @typescript-eslint/naming-convention */
import * as P from '@konker.dev/effect-ts-prelude';

import type { DynamoDBDocumentClientDeps } from '@konker.dev/aws-client-effect-dynamodb/dist/lib/client';
import { defaultDynamoDBDocumentClientFactoryDeps } from '@konker.dev/aws-client-effect-dynamodb/dist/lib/client';
import type { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { mockMomentoClientFactoryDeps } from '@konker.dev/momento-cache-client-effect/dist/lib/test';
import { JsonHashCacheKeyResolver } from '@konker.dev/tiny-cache-fp/dist/lib/CacheKeyResolver/JsonHashCacheKeyResolver';
import { MomentoStringCacheJson } from '@konker.dev/tiny-cache-fp/dist/momento/MomentoStringCacheJson';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import * as M from '../../contrib';
import {
  CORRECT_TEST_PATH_TOKEN_VALUE,
  mockPathTokenAuthorizerDeps,
  TEST_SECRET_TOKEN_ENV_NAME,
} from '../../contrib/pathTokenAuthorizer/index.test';
import type { BaseResponse } from '../../lib/http';

const Body = P.Schema.Struct({
  foo: P.Schema.String,
  bar: P.Schema.Number,
  baz: P.Schema.Boolean,
});
type Body = P.Schema.Schema.Type<typeof Body>;

const Env = P.Schema.Struct({
  MOMENTO_AUTH_TOKEN: P.Schema.String,
});
type Env = P.Schema.Schema.Type<typeof Env>;

const Headers = P.Schema.Struct({
  'content-type': P.Schema.String,
});
type Headers = P.Schema.Schema.Type<typeof Headers>;

const PathParams = P.Schema.Struct({
  id: P.Schema.String,
  pathToken: P.Schema.String,
});
type PathParams = P.Schema.Schema.Type<typeof PathParams>;

const QueryParams = P.Schema.Struct({
  q: P.Schema.String,
});
type QueryParams = P.Schema.Schema.Type<typeof QueryParams>;

describe('kitchen sink', () => {
  let oldEnv: NodeJS.ProcessEnv;
  let __cache: any;

  beforeAll(() => {
    oldEnv = process.env;
    process.env = {
      MOMENTO_AUTH_TOKEN: 'TEST_MOMENTO_AUTH_TOKEN',
      [TEST_SECRET_TOKEN_ENV_NAME]: CORRECT_TEST_PATH_TOKEN_VALUE,
    };

    __cache = {};
  });
  afterAll(() => {
    process.env = oldEnv;
  });

  it('should work as expected', async () => {
    function echoCore(
      i: APIGatewayProxyEventV2 &
        M.bodyValidator.WithValidatedBody<Body> &
        M.pathParametersValidator.WithValidatedPathParameters<PathParams> &
        M.queryStringValidator.WithValidatedQueryStringParameters<QueryParams> &
        M.headersValidator.WithValidatedHeaders<Headers>
    ): P.Effect.Effect<BaseResponse, never, DynamoDBDocumentClientDeps | MomentoClientDeps> {
      return P.Effect.succeed({
        statusCode: 200,
        headers: { 'content-type': 'application/json; charset=UTF-8' },
        multiValueHeaders: {},
        isBase64Encoded: false,
        body: {
          foo: i.body.foo.toUpperCase(),
          bar: i.body.bar * 2,
          baz: !i.body.baz,
          pt: i.pathParameters.pathToken,
          q: i.queryStringParameters.q,
          h: i.headers['content-type'].toUpperCase(),
        },
      });
    }

    const stack = P.pipe(
      echoCore,
      M.dynamodbDocClientInit.middleware({ region: 'eu-west-1' }),
      M.bodyValidator.middleware(Body),
      M.jsonBodyParser.middleware(),
      M.base64BodyDecoder.middleware(),
      M.headersValidator.middleware(Headers),
      M.headersNormalizer.middleware(),
      M.helmetJsHeaders.middleware(),
      M.queryStringValidator.middleware(QueryParams),
      M.pathTokenAuthorizer.middleware(),
      M.pathParametersValidator.middleware(PathParams),
      M.identity.middleware(),
      M.trivial.middleware(),
      M.awsApiGatewayProcessor.middleware(),
      M.requestResponseLogger.middleware(),
      M.cacheInMemory.middleware(JsonHashCacheKeyResolver()),
      M.cacheMomento.middleware(JsonHashCacheKeyResolver(), MomentoStringCacheJson()),
      M.momentoClientInit.middleware({}),
      M.envValidator.middleware(Env)
    );

    const actual1 = stack({
      version: 'string',
      routeKey: 'string',
      rawPath: 'string',
      rawQueryString: 'string',
      // cookies?: [],
      headers: { 'content-type': 'application/json; charset=UTF-8' },
      queryStringParameters: {
        q: 'wtf',
      },
      requestContext: {} as any,
      body: '{ "foo": "abc", "bar": 123, "baz": true }',
      pathParameters: {
        id: 'test-id',
        pathToken: CORRECT_TEST_PATH_TOKEN_VALUE,
      },
      isBase64Encoded: false,
      // stageVariables?: {},
    });

    await expect(
      P.Effect.runPromise(
        P.pipe(
          actual1,
          defaultDynamoDBDocumentClientFactoryDeps,
          mockMomentoClientFactoryDeps(__cache),
          mockPathTokenAuthorizerDeps
        )
      )
    ).resolves.toStrictEqual({
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Security-Policy':
          "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Origin-Agent-Cluster': '?1',
        'Referrer-Policy': 'no-referrer',
        'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-DNS-Prefetch-Control': 'off',
        'X-Download-Options': 'noopen',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Permitted-Cross-Domain-Policies': 'none',
        'X-XSS-Protection': '0',
      },
      multiValueHeaders: {},
      isBase64Encoded: false,
      body: '{"foo":"ABC","bar":246,"baz":false,"pt":"test-token-value","q":"wtf","h":"APPLICATION/JSON; CHARSET=UTF-8"}',
    });

    expect(__cache).toHaveProperty('default-cache_dc38238ad790b39a6d3fa5325c24f112');
  });
});
