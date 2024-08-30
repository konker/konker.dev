import * as P from '@konker.dev/effect-ts-prelude';

import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClientDeps, DynamoDBDocumentClientFactoryDeps } from '@konker.dev/aws-client-effect-dynamodb';

import type { Handler } from '../../index';
import type { MiddlewareError } from '../../lib/MiddlewareError';
import { depsCleanupDynamoDB, depsSetupDynamoDB } from './lib';

const TAG = 'dynamodbDocClientInit';

export type Adapted<R> = Exclude<R, DynamoDBDocumentClientDeps> | DynamoDBDocumentClientFactoryDeps;

export const middleware =
  (config: DynamoDBClientConfig) =>
  <I, O, E, R>(
    wrapped: Handler<I, O, E, R | DynamoDBDocumentClientDeps>
  ): Handler<I, O, E | MiddlewareError, Adapted<R>> =>
  (i: I) =>
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
