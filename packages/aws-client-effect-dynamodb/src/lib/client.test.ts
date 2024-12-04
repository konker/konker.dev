import * as P from '@konker.dev/effect-ts-prelude';

import * as dynamodb from '@aws-sdk/client-dynamodb';
import * as dynamodbDocClient from '@aws-sdk/lib-dynamodb';

import * as unit from './client';
import { DynamoDBDocumentClientDeps, DynamoDBDocumentClientFactoryDeps } from './client';

describe('aws-client-effect-dynamodb/lib/client', () => {
  // ------------------------------------------------------------------------
  describe('Factories', () => {
    test('defaultDynamoDBClientFactory works as expected', async () => {
      expect(unit.defaultDynamoDBClientFactory({})).toBeInstanceOf(dynamodb.DynamoDBClient);
    });

    test('defaultDynamoDBDocumentClientFactory works as expected', async () => {
      expect(unit.defaultDynamoDBDocumentClientFactory(unit.defaultDynamoDBClientFactory({}))).toBeInstanceOf(
        dynamodbDocClient.DynamoDBDocumentClient
      );
    });
  });

  describe('Deps', () => {
    test('defaultDynamoDBClientFactoryDeps works as expected', async () => {
      const actualUnwrapped = P.pipe(
        unit.DynamoDBClientFactoryDeps,
        P.Effect.map((deps) => deps.dynamoDBClientFactory({})),
        unit.defaultDynamoDBClientFactoryDeps
      );

      expect(P.Effect.runSync(actualUnwrapped)).toBeInstanceOf(dynamodb.DynamoDBClient);
    });

    test('defaultDynamoDBDocumentClientFactoryDeps works as expected', async () => {
      const defaultClientHandle = unit.defaultDynamoDBClientFactory({});
      const actualEffect = P.pipe(
        unit.DynamoDBDocumentClientFactoryDeps,
        P.Effect.map((deps) => [
          deps.dynamoDBClientFactory({}),
          deps.dynamoDBDocumentClientFactory(defaultClientHandle),
        ]),
        unit.defaultDynamoDBDocumentClientFactoryDeps
      );
      const actual = P.Effect.runSync(actualEffect);

      expect(actual[0]).toBeInstanceOf(dynamodb.DynamoDBClient);
      expect(actual[1]).toBeInstanceOf(dynamodbDocClient.DynamoDBDocumentClient);
    });

    test('defaultDynamoDBDocumentClientDeps works as expected', async () => {
      const actualEffect = P.pipe(
        unit.DynamoDBDocumentClientDeps,
        P.Effect.map((deps) => [deps.dynamoDBClient, deps.dynamoDBDocumentClient]),
        unit.defaultDynamoDBDocumentClientDeps({})
      );
      const actual = P.Effect.runSync(actualEffect);

      expect(actual[0]).toBeInstanceOf(dynamodb.DynamoDBClient);
      expect(actual[1]).toBeInstanceOf(dynamodbDocClient.DynamoDBDocumentClient);
    });
  });

  describe('Helpers', () => {
    test('createDynamoDBDocumentClientDeps works as expected', async () => {
      const actualEffect = P.pipe(
        DynamoDBDocumentClientFactoryDeps,
        P.Effect.flatMap((factoryDeps) => P.pipe(factoryDeps, unit.createDynamoDBDocumentClientDeps({}))),
        P.Effect.flatMap((deps) =>
          P.pipe(
            DynamoDBDocumentClientDeps,
            P.Effect.map((unwrappedDeps) => [unwrappedDeps.dynamoDBClient, unwrappedDeps.dynamoDBDocumentClient]),
            P.Effect.provideService(DynamoDBDocumentClientDeps, deps)
          )
        ),
        unit.defaultDynamoDBDocumentClientFactoryDeps
      );
      const actual = await P.Effect.runPromise(actualEffect);

      expect(actual[0]).toBeInstanceOf(dynamodb.DynamoDBClient);
      expect(actual[1]).toBeInstanceOf(dynamodbDocClient.DynamoDBDocumentClient);
    });

    test('cleanupDynamoDBDocumentClientDeps works as expected', async () => {
      const actualEffect = P.pipe(
        DynamoDBDocumentClientDeps,
        P.Effect.flatMap((deps) => unit.cleanupDynamoDBDocumentClientDeps(deps)()),
        unit.defaultDynamoDBDocumentClientDeps({})
      );

      await expect(P.Effect.runPromise(actualEffect)).resolves.toBeUndefined();
    });
  });
});
