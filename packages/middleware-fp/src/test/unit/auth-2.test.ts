import type { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as M from '../../contrib/index.js';
import event from '../fixtures/APIGatewayRequestAuthorizerEventV2-1.json' with { type: 'json' };

const CORRECT_TEST_PATH_TOKEN_VALUE = 'test-token-value';
const TEST_SECRET_TOKEN_ENV_NAME = 'test-secret-token-env-name';

const Env = Schema.Struct({
  MOMENTO_AUTH_TOKEN: Schema.String,
});
type Env = Schema.Schema.Type<typeof Env>;

const Headers = Schema.Struct({
  header1: Schema.String,
});
type Headers = Schema.Schema.Type<typeof Headers>;

type CoreEvent = APIGatewayRequestAuthorizerEventV2 &
  M.envValidator.WithValidatedEnv<Env> &
  M.headersValidator.WithValidatedHeaders<Headers>;

describe('auth test 2', () => {
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
    function echoCore(_i: CoreEvent): Effect.Effect<APIGatewayAuthorizerResult, Error, never> {
      return Effect.fail(new Error('BOOM!'));
    }

    const stack = pipe(
      echoCore,
      M.headersValidator.middleware(Headers),
      M.headersNormalizer.middleware(),
      M.envValidator.middleware(Env),
      M.awsIamAuthorizerProcessor.middleware(),
      M.requestResponseLogger.middleware()
    );

    const actual1 = stack(event as APIGatewayRequestAuthorizerEventV2);

    await expect(Effect.runPromise(actual1)).resolves.toStrictEqual({
      context: {
        principalId: 'anon',
      },
      policyDocument: {
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      principalId: 'anon',
    });
  });
});
