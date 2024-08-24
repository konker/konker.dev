import * as P from '@konker.dev/effect-ts-prelude';

import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClientDeps, DynamoDBDocumentClientFactoryDeps } from '@konker.dev/aws-client-effect-dynamodb';

import type { Handler } from '../index';
import type { MiddlewareError } from '../lib/MiddlewareError';
import { toMiddlewareError } from '../lib/MiddlewareError';

const TAG = 'dynamodb-doc-client-init';

// --------------------------------------------------------------------------
export function depsSetupDynamoDB<A1 extends DynamoDBDocumentClientFactoryDeps>(config: DynamoDBClientConfig) {
  return function (deps: A1): P.Effect.Effect<A1 & DynamoDBDocumentClientDeps, MiddlewareError, never> {
    return P.Effect.tryPromise({
      try: async () => {
        const clientHandle = deps.dynamoDBClientFactory(config);
        const docClientHandle = deps.dynamoDBDocumentClientFactory(clientHandle);
        return {
          ...deps,
          dynamoDBClient: () => clientHandle,
          dynamoDBDocumentClient: () => docClientHandle,
        };
      },
      catch: toMiddlewareError,
    });
  };
}

export const depsCleanupDynamoDB =
  <R2 extends DynamoDBDocumentClientDeps>(r2: R2) =>
  () => {
    return P.Effect.tryPromise({
      // eslint-disable-next-line fp/no-nil
      try: async () => {
        // eslint-disable-next-line fp/no-unused-expression
        r2.dynamoDBDocumentClient().destroy();
        // eslint-disable-next-line fp/no-unused-expression
        r2.dynamoDBClient().destroy();
      },
      catch: toMiddlewareError,
    });
  };

// --------------------------------------------------------------------------
export const middleware =
  (config: DynamoDBClientConfig) =>
  <WI, WO, WE, WR>(
    wrapped: Handler<WI, WO, WE, WR | DynamoDBDocumentClientDeps>
  ): Handler<
    WI,
    WO,
    WE | MiddlewareError,
    Exclude<WR, DynamoDBDocumentClientDeps> | DynamoDBDocumentClientFactoryDeps
  > =>
  (i: WI) =>
    P.pipe(
      // TODO: a bit too nested?
      DynamoDBDocumentClientFactoryDeps,
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap((factoryDeps) =>
        P.pipe(
          factoryDeps,
          depsSetupDynamoDB(config),
          P.Effect.flatMap((deps) =>
            P.pipe(
              wrapped(i),
              P.Effect.provideService(DynamoDBDocumentClientDeps, deps),
              P.Effect.tap(depsCleanupDynamoDB(deps))
            )
          )
        )
      ),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
