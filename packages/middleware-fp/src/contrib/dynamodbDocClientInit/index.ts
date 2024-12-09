import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  cleanupDynamoDBDocumentClientDeps,
  createDynamoDBDocumentClientDeps,
  DynamoDBDocumentClientDeps,
  DynamoDBDocumentClientFactoryDeps,
} from '@konker.dev/aws-client-effect-dynamodb/dist/lib/client';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

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
    pipe(
      Effect.Do,
      Effect.bind('factoryDeps', () => DynamoDBDocumentClientFactoryDeps),
      Effect.bind('dynamoDbDocumentClientDeps', ({ factoryDeps }) =>
        pipe(factoryDeps, createDynamoDBDocumentClientDeps(config), Effect.mapError(toMiddlewareError))
      ),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(({ dynamoDbDocumentClientDeps }) =>
        pipe(
          wrapped(i),
          Effect.provideService(DynamoDBDocumentClientDeps, dynamoDbDocumentClientDeps),
          Effect.tap(cleanupDynamoDBDocumentClientDeps(dynamoDbDocumentClientDeps)),
          Effect.mapError(toMiddlewareError)
        )
      ),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
