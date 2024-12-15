import * as dynamodb from '@aws-sdk/client-dynamodb';
import * as dynamodbDocClient from '@aws-sdk/lib-dynamodb';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, test } from 'vitest';

import { DynamoDBDocumentClientDeps, DynamoDBDocumentClientFactoryDeps } from './client.js';
import * as unit from './client.js';

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
      const actualUnwrapped = pipe(
        unit.DynamoDBClientFactoryDeps,
        Effect.map((deps) => deps.dynamoDBClientFactory({})),
        unit.defaultDynamoDBClientFactoryDeps
      );

      expect(Effect.runSync(actualUnwrapped)).toBeInstanceOf(dynamodb.DynamoDBClient);
    });

    test('defaultDynamoDBDocumentClientFactoryDeps works as expected', async () => {
      const defaultClientHandle = unit.defaultDynamoDBClientFactory({});
      const actualEffect = pipe(
        unit.DynamoDBDocumentClientFactoryDeps,
        Effect.map((deps) => [deps.dynamoDBClientFactory({}), deps.dynamoDBDocumentClientFactory(defaultClientHandle)]),
        unit.defaultDynamoDBDocumentClientFactoryDeps
      );
      const actual = Effect.runSync(actualEffect);

      expect(actual[0]).toBeInstanceOf(dynamodb.DynamoDBClient);
      expect(actual[1]).toBeInstanceOf(dynamodbDocClient.DynamoDBDocumentClient);
    });

    test('defaultDynamoDBDocumentClientDeps works as expected', async () => {
      const actualEffect = pipe(
        unit.DynamoDBDocumentClientDeps,
        Effect.map((deps) => [deps.dynamoDBClient, deps.dynamoDBDocumentClient]),
        unit.defaultDynamoDBDocumentClientDeps({})
      );
      const actual = Effect.runSync(actualEffect);

      expect(actual[0]).toBeInstanceOf(dynamodb.DynamoDBClient);
      expect(actual[1]).toBeInstanceOf(dynamodbDocClient.DynamoDBDocumentClient);
    });
  });

  describe('Helpers', () => {
    test('createDynamoDBDocumentClientDeps works as expected', async () => {
      const actualEffect = pipe(
        DynamoDBDocumentClientFactoryDeps,
        Effect.flatMap((factoryDeps) => pipe(factoryDeps, unit.createDynamoDBDocumentClientDeps({}))),
        Effect.flatMap((deps) =>
          pipe(
            DynamoDBDocumentClientDeps,
            Effect.map((unwrappedDeps) => [unwrappedDeps.dynamoDBClient, unwrappedDeps.dynamoDBDocumentClient]),
            Effect.provideService(DynamoDBDocumentClientDeps, deps)
          )
        ),
        unit.defaultDynamoDBDocumentClientFactoryDeps
      );
      const actual = await Effect.runPromise(actualEffect);

      expect(actual[0]).toBeInstanceOf(dynamodb.DynamoDBClient);
      expect(actual[1]).toBeInstanceOf(dynamodbDocClient.DynamoDBDocumentClient);
    });

    test('cleanupDynamoDBDocumentClientDeps works as expected', async () => {
      const actualEffect = pipe(
        DynamoDBDocumentClientDeps,
        Effect.flatMap((deps) => unit.cleanupDynamoDBDocumentClientDeps(deps)()),
        unit.defaultDynamoDBDocumentClientDeps({})
      );

      await expect(Effect.runPromise(actualEffect)).resolves.toBeUndefined();
    });
  });
});
