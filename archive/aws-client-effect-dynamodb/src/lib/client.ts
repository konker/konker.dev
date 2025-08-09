import * as dynamodb from '@aws-sdk/client-dynamodb';
import * as dynamodbDocClient from '@aws-sdk/lib-dynamodb';
import type { Client } from '@aws-sdk/types';
import { Context } from 'effect';
import * as Effect from 'effect/Effect';

import type { DynamoDbError } from './error.js';
import { toDynamoDbError } from './error.js';

//------------------------------------------------------
export type DynamoDBClientFactory = (config: dynamodb.DynamoDBClientConfig) => dynamodb.DynamoDBClient;
export const defaultDynamoDBClientFactory: DynamoDBClientFactory = (config: dynamodb.DynamoDBClientConfig) =>
  new dynamodb.DynamoDBClient(config);

//------------------------------------------------------
export type DynamoDBClientFactoryDeps = {
  readonly dynamoDBClientFactory: DynamoDBClientFactory;
};
export const DynamoDBClientFactoryDeps = Context.GenericTag<DynamoDBClientFactoryDeps>(
  'aws-client-effect-dynamodb/DynamoDBFactoryDeps'
);

export const defaultDynamoDBClientFactoryDeps = Effect.provideService(
  DynamoDBClientFactoryDeps,
  DynamoDBClientFactoryDeps.of({
    dynamoDBClientFactory: defaultDynamoDBClientFactory,
  })
);

//------------------------------------------------------
export type DynamoDBDocumentClientFactory = (
  dynamodbClient: dynamodb.DynamoDBClient
) => dynamodbDocClient.DynamoDBDocumentClient;

export const defaultDynamoDBDocumentClientFactory = (dynamodbClient: dynamodb.DynamoDBClient) =>
  dynamodbDocClient.DynamoDBDocumentClient.from(dynamodbClient);

//------------------------------------------------------
export type DynamoDBDocumentClientFactoryDeps = {
  readonly dynamoDBClientFactory: DynamoDBClientFactory;
  readonly dynamoDBDocumentClientFactory: DynamoDBDocumentClientFactory;
};
export const DynamoDBDocumentClientFactoryDeps = Context.GenericTag<DynamoDBDocumentClientFactoryDeps>(
  'aws-client-effect-dynamodb/DynamoDBDocumentClientFactoryDeps'
);

export const defaultDynamoDBDocumentClientFactoryDeps = Effect.provideService(
  DynamoDBDocumentClientFactoryDeps,
  DynamoDBDocumentClientFactoryDeps.of({
    dynamoDBClientFactory: defaultDynamoDBClientFactory,
    dynamoDBDocumentClientFactory: defaultDynamoDBDocumentClientFactory,
  })
);

//------------------------------------------------------
export type DynamoDBDocumentClientDeps = {
  readonly dynamoDBDocumentClient: Client<
    dynamodbDocClient.ServiceInputTypes,
    dynamodbDocClient.ServiceOutputTypes,
    unknown
  >;
  readonly dynamoDBClient: dynamodb.DynamoDBClient;
};
export const DynamoDBDocumentClientDeps = Context.GenericTag<DynamoDBDocumentClientDeps>(
  'aws-client-effect-dynamodb/DynamoDBDocumentClientDeps'
);

export const defaultDynamoDBDocumentClientDeps = (config: dynamodb.DynamoDBClientConfig) => {
  const defaultClientHandle = defaultDynamoDBClientFactory(config);
  const defaultDocClientHandle = defaultDynamoDBDocumentClientFactory(defaultClientHandle);

  return Effect.provideService(
    DynamoDBDocumentClientDeps,
    DynamoDBDocumentClientDeps.of({
      dynamoDBClient: defaultClientHandle,
      dynamoDBDocumentClient: defaultDocClientHandle,
    })
  );
};

//------------------------------------------------------
export const createDynamoDBDocumentClientDeps =
  (config: dynamodb.DynamoDBClientConfig) =>
  (factoryDeps: DynamoDBDocumentClientFactoryDeps): Effect.Effect<DynamoDBDocumentClientDeps, DynamoDbError> =>
    Effect.tryPromise({
      try: async () => {
        const clientHandle = factoryDeps.dynamoDBClientFactory(config);
        const docClientHandle = factoryDeps.dynamoDBDocumentClientFactory(clientHandle);
        return DynamoDBDocumentClientDeps.of({
          dynamoDBClient: clientHandle,
          dynamoDBDocumentClient: docClientHandle,
        });
      },
      catch: toDynamoDbError({}),
    });

//------------------------------------------------------
export const cleanupDynamoDBDocumentClientDeps = (deps: DynamoDBDocumentClientDeps) => () => {
  return Effect.tryPromise({
    // eslint-disable-next-line fp/no-nil
    try: async () => {
      // eslint-disable-next-line fp/no-unused-expression
      deps.dynamoDBDocumentClient.destroy();
      // eslint-disable-next-line fp/no-unused-expression
      deps.dynamoDBClient.destroy();
    },
    catch: toDynamoDbError({}),
  });
};
