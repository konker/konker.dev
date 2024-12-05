/* eslint-disable @typescript-eslint/naming-convention */
import * as P from '@konker.dev/effect-ts-prelude';

import { TEST_TOKEN } from '@konker.dev/tiny-auth-utils-fp/dist/test/fixtures/test-jwt-tokens';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import * as M from '../../contrib';
import { CORRECT_TEST_PATH_TOKEN_VALUE, TEST_SECRET_TOKEN_ENV_NAME } from '../../contrib/pathTokenAuthorizer.test';
import type { BaseResponse } from '../../lib/http';

const Env = P.Schema.Struct({
  MOMENTO_AUTH_TOKEN: P.Schema.String,
});
type Env = P.Schema.Schema.Type<typeof Env>;

const Headers = P.Schema.Struct({
  'content-type': P.Schema.String,
  authorization: P.Schema.String,
});
type Headers = P.Schema.Schema.Type<typeof Headers>;

type CoreEvent = APIGatewayProxyEventV2 &
  M.jwtDecoder.WithUserId &
  M.envValidator.WithValidatedEnv<Env> &
  M.headersValidator.WithValidatedHeaders<Headers>;

describe('basic test 3', () => {
  let oldEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    oldEnv = process.env;
    process.env = {
      MOMENTO_AUTH_TOKEN: 'TEST_MOMENTO_AUTH_TOKEN',
      [TEST_SECRET_TOKEN_ENV_NAME]: CORRECT_TEST_PATH_TOKEN_VALUE,
    };
  });
  afterAll(() => {
    process.env = oldEnv;
  });

  it('should work as expected', async () => {
    function echoCore(i: CoreEvent): P.Effect.Effect<BaseResponse, never, never> {
      return P.Effect.succeed({
        statusCode: 200,
        headers: { 'content-type': 'application/json; charset=UTF-8' },
        multiValueHeaders: {},
        isBase64Encoded: false,
        body: {
          foo: i.validatedEnv.MOMENTO_AUTH_TOKEN,
          h: i.headers['content-type'].toUpperCase(),
          u: i.userId,
        },
      });
    }

    const stack = P.pipe(
      echoCore,
      M.jwtDecoder.middleware(),
      M.headersValidator.middleware(Headers),
      M.headersNormalizer.middleware(),
      M.envValidator.middleware(Env),
      M.awsApiGatewayProcessor.middleware(),
      M.requestResponseLogger.middleware()
    );

    const actual1 = stack({
      version: 'string',
      routeKey: 'string',
      rawPath: 'string',
      rawQueryString: 'string',
      // cookies?: [],
      headers: {
        'content-type': 'application/json; charset=UTF-8',
        authorization: `Bearer ${TEST_TOKEN}`,
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

    await expect(P.Effect.runPromise(P.pipe(actual1))).resolves.toStrictEqual({
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
