import type { MomentoClientDeps } from '@konker.dev/momento-cache-client-effect';
import { mockMomentoClientFactoryDeps } from '@konker.dev/momento-cache-client-effect/lib/test';
import type { JwtVerificationConfig } from '@konker.dev/tiny-auth-utils-fp/jwt';
import {
  TEST_JWT_ISS,
  TEST_JWT_NOW_MS,
  TEST_JWT_SIGNING_SECRET,
} from '@konker.dev/tiny-auth-utils-fp/test/fixtures/jwt';
import { TEST_TOKEN } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/test-jwt-tokens';
import { JsonCache } from '@konker.dev/tiny-cache-fp';
import { JsonHashCacheKeyResolver } from '@konker.dev/tiny-cache-fp/lib/CacheKeyResolver/JsonHashCacheKeyResolver';
import { MomentoStringCache } from '@konker.dev/tiny-cache-fp/momento/MomentoStringCache';
import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import * as M from '../../http/contrib/index.js';
import * as unit from '../../http/contrib/jwtAuthenticator.js';
import { PathTokenAuthorizerDeps } from '../../http/contrib/pathTokenAuthorizer.js';
import type { RequestW } from '../../http/request.js';
import { makeResponseW, type ResponseW } from '../../http/response.js';

export const CORRECT_TEST_PATH_TOKEN_VALUE = 'test-token-value';
export const TEST_SECRET_TOKEN_ENV_NAME = 'test-secret-token-env-name';

export const JWT_AUTHENTICATOR_TEST_DEPS: JwtVerificationConfig = unit.JwtAuthenticatorDeps.of({
  signingSecret: TEST_JWT_SIGNING_SECRET,
  issuer: TEST_JWT_ISS,
});

export const mockJwtAuthenticatorDeps = Effect.provideService(unit.JwtAuthenticatorDeps, JWT_AUTHENTICATOR_TEST_DEPS);

export const PATH_TOKEN_AUTHORIZER_TEST_DEPS: PathTokenAuthorizerDeps = PathTokenAuthorizerDeps.of({
  secretTokenEnvName: TEST_SECRET_TOKEN_ENV_NAME,
  pathParamName: 'pathToken',
});

export const mockPathTokenAuthorizerDeps = Effect.provideService(
  PathTokenAuthorizerDeps,
  PATH_TOKEN_AUTHORIZER_TEST_DEPS
);

const Body = Schema.Struct({
  foo: Schema.String,
  bar: Schema.Number,
  baz: Schema.Boolean,
});
type Body = Schema.Schema.Type<typeof Body>;

const Env = Schema.Struct({
  MOMENTO_AUTH_TOKEN: Schema.String,
});
type Env = Schema.Schema.Type<typeof Env>;

const Headers = Schema.Struct({
  'content-type': Schema.String,
  authorization: Schema.String,
});
type Headers = Schema.Schema.Type<typeof Headers>;

const PathParams = Schema.Struct({
  id: Schema.String,
  pathToken: Schema.String,
});
type PathParams = Schema.Schema.Type<typeof PathParams>;

const QueryParams = Schema.Struct({
  q: Schema.String,
});
type QueryParams = Schema.Schema.Type<typeof QueryParams>;

describe('kitchen sink', () => {
  let oldEnv: NodeJS.ProcessEnv;
  let __cache: any;

  beforeAll(() => {
    oldEnv = process.env;
    process.env = {
      MOMENTO_AUTH_TOKEN: 'TEST_MOMENTO_AUTH_TOKEN',
      [TEST_SECRET_TOKEN_ENV_NAME]: CORRECT_TEST_PATH_TOKEN_VALUE,
    };
    vi.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);

    __cache = {};
  });
  afterAll(() => {
    vi.restoreAllMocks();
    process.env = oldEnv;
  });

  it('should work as expected', async () => {
    function echoCore(
      i: RequestW<
        M.bodyValidator.WithValidatedBody<Body> &
          M.pathParametersValidator.WithValidatedPathParameters<PathParams> &
          M.queryStringValidator.WithValidatedQueryStringParameters<QueryParams> &
          M.headersValidator.WithValidatedHeaders<Headers> &
          M.jwtAuthenticator.WithUserId
      >
    ): Effect.Effect<ResponseW, never, never> {
      return Effect.succeed(
        makeResponseW({
          statusCode: 200,
          headers: { 'content-type': 'application/json; charset=UTF-8' },
          multiValueHeaders: {},
          isBase64Encoded: false,
          i: JSON.stringify(i, null, 2),
          body: JSON.stringify({
            foo: i.body.foo.toUpperCase(),
            bar: i.body.bar * 2,
            baz: !i.body.baz,
            pt: i.pathParameters.pathToken,
            q: i.queryStringParameters.q,
            h: i.headers['content-type'].toUpperCase(),
            u: i.userId,
          }),
        })
      );
    }

    const stack = pipe(
      echoCore,
      M.bodyValidator.middleware(Body),
      M.jsonBodyParser.middleware(),
      M.base64BodyDecoder.middleware(() => false),
      M.jwtAuthenticator.middleware(),
      M.headersValidator.middleware(Headers),
      M.headersNormalizer.middleware(),
      M.queryStringValidator.middleware(QueryParams),
      M.pathTokenAuthorizer.middleware(),
      M.pathParametersValidator.middleware(PathParams),
      M.identity.middleware(),
      M.trivial.middleware(),
      M.helmetJsHeaders.middleware(),
      M.responseProcessor.middleware(),
      M.requestResponseLogger.middleware(),
      M.cacheInMemory.middleware(JsonHashCacheKeyResolver()),
      M.cacheMomento.middleware(JsonHashCacheKeyResolver(), JsonCache<MomentoClientDeps>(MomentoStringCache)),
      M.momentoClientInit.middleware({}),
      M.envValidator.middleware(Env)
    );

    const actual1 = stack({
      url: '/',
      // version: 'string',
      // routeKey: 'string',
      // rawPath: 'string',
      // rawQueryString: 'string',
      method: 'POST',
      // cookies?: [],
      headers: {
        'content-type': 'application/json; charset=UTF-8',
        authorization: `Bearer ${TEST_TOKEN}`,
      },
      queryStringParameters: {
        q: 'wtf',
      },
      // requestContext: {} as any,
      body: '{ "foo": "abc", "bar": 123, "baz": true }',
      pathParameters: {
        id: 'test-id',
        pathToken: CORRECT_TEST_PATH_TOKEN_VALUE,
      },
      // stageVariables?: {},
    });

    await expect(
      Effect.runPromise(
        pipe(actual1, mockPathTokenAuthorizerDeps, mockJwtAuthenticatorDeps, mockMomentoClientFactoryDeps(__cache))
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
      isBase64Encoded: false,
      multiValueHeaders: {},
      body: '{"foo":"ABC","bar":246,"baz":false,"pt":"test-token-value","q":"wtf","h":"APPLICATION/JSON; CHARSET=UTF-8","u":"test-sub"}',
      i: `{
  "url": "/",
  "method": "POST",
  "headers": {
    "content-type": "application/json; charset=UTF-8",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4LCJpc3MiOiJ0ZXN0LWlzcyJ9.IfZ_IlbKl2S7pkKBqTis0kyBmDuXGbBkCdCkrDdLq_Q"
  },
  "queryStringParameters": {
    "q": "wtf"
  },
  "body": {
    "foo": "abc",
    "bar": 123,
    "baz": true
  },
  "pathParameters": {
    "id": "test-id",
    "pathToken": "test-token-value"
  },
  "validatedEnv": {
    "MOMENTO_AUTH_TOKEN": "TEST_MOMENTO_AUTH_TOKEN"
  },
  "pathParametersValidatorRaw": {
    "id": "test-id",
    "pathToken": "test-token-value"
  },
  "queryStringValidatorRaw": {
    "q": "wtf"
  },
  "headersNormalizerRequestRaw": {
    "content-type": "application/json; charset=UTF-8",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4LCJpc3MiOiJ0ZXN0LWlzcyJ9.IfZ_IlbKl2S7pkKBqTis0kyBmDuXGbBkCdCkrDdLq_Q"
  },
  "headersValidatorRaw": {
    "content-type": "application/json; charset=UTF-8",
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJzdWIiOiJ0ZXN0LXN1YiIsImlhdCI6MTY3MTU3MzgwOCwiZXhwIjoxNjcxNTc3NDA4LCJpc3MiOiJ0ZXN0LWlzcyJ9.IfZ_IlbKl2S7pkKBqTis0kyBmDuXGbBkCdCkrDdLq_Q"
  },
  "userId": "test-sub",
  "jsonBodyParserRaw": "{ \\"foo\\": \\"abc\\", \\"bar\\": 123, \\"baz\\": true }",
  "bodyValidatorRaw": {
    "foo": "abc",
    "bar": 123,
    "baz": true
  }
}`,
    });

    expect(__cache).toHaveProperty('default-cache_e910b73b0866b50e5be3fe318b53fbc2');
  });
});
