import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as M from '../../http/contrib/index.js';
import type { RequestW } from '../../http/request.js';
import { makeResponseW, type ResponseW } from '../../http/response.js';

const CORRECT_TEST_PATH_TOKEN_VALUE = 'test-token-value';
const TEST_SECRET_TOKEN_ENV_NAME = 'test-secret-token-env-name';

const Env = Schema.Struct({
  MOMENTO_AUTH_TOKEN: Schema.String,
});
type Env = Schema.Schema.Type<typeof Env>;

const Headers = Schema.Struct({
  'content-type': Schema.String,
});
type Headers = Schema.Schema.Type<typeof Headers>;

type CoreEvent = RequestW<M.envValidator.WithValidatedEnv<Env> & M.headersValidator.WithValidatedHeaders<Headers>>;

describe('basic test 1', () => {
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
          }),
        })
      );
    }

    const stack = pipe(
      echoCore,
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
      // cookies?: [],
      method: 'GET',
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

    await expect(Effect.runPromise(actual1)).resolves.toStrictEqual({
      body: '{"foo":"TEST_MOMENTO_AUTH_TOKEN","h":"APPLICATION/JSON; CHARSET=UTF-8"}',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      isBase64Encoded: false,
      multiValueHeaders: {},
      statusCode: 200,
    });
  });
});
