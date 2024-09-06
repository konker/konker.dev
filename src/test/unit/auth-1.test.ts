/* eslint-disable @typescript-eslint/naming-convention */
import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';

import * as M from '../../contrib';
import {
  CORRECT_TEST_PATH_TOKEN_VALUE,
  TEST_SECRET_TOKEN_ENV_NAME,
} from '../../contrib/pathTokenAuthorizer/index.test';
import type { BaseSimpleAuthResponse } from '../../lib/http';
import event from '../fixtures/APIGatewayRequestAuthorizerEventV2-1.json';

const Env = P.Schema.Struct({
  MOMENTO_AUTH_TOKEN: P.Schema.String,
});
type Env = P.Schema.Schema.Type<typeof Env>;

const Headers = P.Schema.Struct({
  header1: P.Schema.String,
});
type Headers = P.Schema.Schema.Type<typeof Headers>;

type CoreEvent = APIGatewayRequestAuthorizerEventV2 &
  M.envValidator.WithValidatedEnv<Env> &
  M.headersValidator.WithValidatedHeaders<Headers>;

describe('auth test 1', () => {
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
    function echoCore(_i: CoreEvent): P.Effect.Effect<BaseSimpleAuthResponse, never, never> {
      return P.Effect.succeed({
        isAuthorized: true,
      });
    }

    const stack = P.pipe(
      echoCore,
      M.headersValidator.middleware(Headers),
      M.headersNormalizer.middleware(),
      M.envValidator.middleware(Env),
      M.awsSimpleAuthorizerProcessor.middleware(),
      M.requestResponseLogger.middleware()
    );

    const actual1 = stack(event as unknown as CoreEvent);

    await expect(P.Effect.runPromise(actual1)).resolves.toStrictEqual({
      isAuthorized: true,
    });
  });
});
