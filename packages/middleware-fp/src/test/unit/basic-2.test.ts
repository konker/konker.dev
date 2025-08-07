import type { JwtVerificationConfigRsa } from '@konker.dev/tiny-auth-utils-fp/jwt/rsa';
import { TEST_JWT_NOW_MS } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/jwt';
import { TEST_RSA_KEY_PUBLIC } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/test-jwt-rsa-keys';
import { TEST_TOKEN_RSA } from '@konker.dev/tiny-auth-utils-fp/test/fixtures/test-jwt-tokens-rsa';
import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import * as M from '../../contrib/index.js';
import * as unit from '../../contrib/jwtAuthenticatorRsa.js';
import { makeResponseW, type RequestW, type ResponseW } from '../../lib/http.js';

const CORRECT_TEST_PATH_TOKEN_VALUE = 'test-token-value';
const TEST_SECRET_TOKEN_ENV_NAME = 'test-secret-token-env-name';

export const JWT_AUTHENTICATOR_RSA_TEST_DEPS: JwtVerificationConfigRsa = unit.JwtAuthenticatorRsaDeps.of({
  rsaPublicKey: TEST_RSA_KEY_PUBLIC,
  issuer: 'test-iss',
});

export const mockJwtAuthenticatorRsaDeps = Effect.provideService(
  unit.JwtAuthenticatorRsaDeps,
  JWT_AUTHENTICATOR_RSA_TEST_DEPS
);

const Env = Schema.Struct({
  MOMENTO_AUTH_TOKEN: Schema.String,
});
type Env = Schema.Schema.Type<typeof Env>;

const Headers = Schema.Struct({
  'content-type': Schema.String,
  authorization: Schema.String,
});
type Headers = Schema.Schema.Type<typeof Headers>;

type CoreEvent = RequestW<
  M.jwtAuthenticatorRsa.WithUserId &
    M.envValidator.WithValidatedEnv<Env> &
    M.headersValidator.WithValidatedHeaders<Headers>
>;

describe('basic test 2', () => {
  let oldEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    oldEnv = process.env;
    process.env = {
      MOMENTO_AUTH_TOKEN: 'TEST_MOMENTO_AUTH_TOKEN',
      [TEST_SECRET_TOKEN_ENV_NAME]: CORRECT_TEST_PATH_TOKEN_VALUE,
    };
    vi.spyOn(Date, 'now').mockReturnValue(TEST_JWT_NOW_MS);
  });
  afterAll(() => {
    vi.restoreAllMocks();
    process.env = oldEnv;
  });

  it('should work as expected', async () => {
    function echoCore(i: CoreEvent): Effect.Effect<ResponseW, never, never> {
      return Effect.succeed(
        makeResponseW({
          statusCode: 200,
          headers: { 'content-type': 'application/json; charset=UTF-8' },
          multiValueHeaders: {},
          isBase64Encoded: false,
          body: JSON.stringify({
            foo: i.validatedEnv.MOMENTO_AUTH_TOKEN,
            h: i.headers['content-type'].toUpperCase(),
            u: i.userId,
          }),
        })
      );
    }

    const stack = pipe(
      echoCore,
      M.jwtAuthenticatorRsa.middleware(),
      M.headersValidator.middleware(Headers),
      M.headersNormalizer.middleware(),
      M.envValidator.middleware(Env),
      M.responseProcessor.middleware(),
      M.requestResponseLogger.middleware()
    );

    const actual1 = stack({
      version: 'string',
      routeKey: 'string',
      rawPath: 'string',
      rawQueryString: 'string',
      method: 'GET',
      // cookies?: [],
      headers: {
        'content-type': 'application/json; charset=UTF-8',
        authorization: `Bearer ${TEST_TOKEN_RSA}`,
      },
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

    await expect(Effect.runPromise(pipe(actual1, mockJwtAuthenticatorRsaDeps))).resolves.toStrictEqual({
      body: '{"foo":"TEST_MOMENTO_AUTH_TOKEN","h":"APPLICATION/JSON; CHARSET=UTF-8","u":"test-sub"}',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      isBase64Encoded: false,
      multiValueHeaders: {},
      statusCode: 200,
    });
  });
});
