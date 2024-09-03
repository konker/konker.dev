import * as P from '@konker.dev/effect-ts-prelude';

import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  cleanupDynamoDBDocumentClientDeps,
  createDynamoDBDocumentClientDeps,
  DynamoDBDocumentClientDeps,
  DynamoDBDocumentClientFactoryDeps,
} from '@konker.dev/aws-client-effect-dynamodb/dist/lib/client';

import type { Handler } from '../../index';
import type { MiddlewareError } from '../../lib/MiddlewareError';
import { toMiddlewareError } from '../../lib/MiddlewareError';

const TAG = 'dynamodbDocClientInit';

export type Adapted<R> = Exclude<R, DynamoDBDocumentClientDeps> | DynamoDBDocumentClientFactoryDeps;

export const middleware =
  (config: DynamoDBClientConfig) =>
  <I, O, E, R>(
    wrapped: Handler<I, O, E, R | DynamoDBDocumentClientDeps>
  ): Handler<I, O, E | MiddlewareError, Adapted<R>> =>
  (i: I) =>
    P.pipe(
      P.Effect.Do,
      P.Effect.bind('factoryDeps', () => DynamoDBDocumentClientFactoryDeps),
      P.Effect.bind('dynamoDbDocumentClientDeps', ({ factoryDeps }) =>
        P.pipe(factoryDeps, createDynamoDBDocumentClientDeps(config), P.Effect.mapError(toMiddlewareError))
      ),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap(({ dynamoDbDocumentClientDeps }) =>
        P.pipe(
          wrapped(i),
          P.Effect.provideService(DynamoDBDocumentClientDeps, dynamoDbDocumentClientDeps),
          P.Effect.tap(cleanupDynamoDBDocumentClientDeps(dynamoDbDocumentClientDeps)),
          P.Effect.mapError(toMiddlewareError)
        )
      ),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
