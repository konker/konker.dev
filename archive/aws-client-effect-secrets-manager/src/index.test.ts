import type {
  BatchGetSecretValueCommandInput,
  CreateSecretCommandInput,
  DeleteSecretCommandInput,
  GetSecretValueCommandInput,
  ListSecretsCommandInput,
  PutSecretValueCommandInput,
} from '@aws-sdk/client-secrets-manager';
import * as secretsManagerClient from '@aws-sdk/client-secrets-manager';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import * as unit from './index.js';
import { SecretsManagerClientDeps } from './index.js';
import { TAG } from './lib/error.js';

const secretsManagerMock = mockClient(secretsManagerClient.SecretsManagerClient);

describe('aws-client-effect-secrets-manager', () => {
  let deps: unit.SecretsManagerClientDeps;

  beforeAll(() => {
    deps = unit.SecretsManagerClientDeps.of({
      secretsManagerClient: new secretsManagerClient.SecretsManagerClient({}),
    });
  });

  describe('Error tag', () => {
    it('should export as expected', () => {
      expect(unit.SECRETS_MANAGER_ERROR_TAG).toEqual('SecretsManagerError');
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultSecretsManagerClientFactory', () => {
    it('should work as expected', async () => {
      expect(unit.defaultSecretsManagerClientFactory({})).toBeInstanceOf(SecretsManagerClient);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultSecretsManagerClientFactoryDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = pipe(
        unit.SecretsManagerClientFactoryDeps,
        Effect.map((deps) => deps.secretsManagerClientFactory),
        unit.defaultSecretsManagerClientFactoryDeps
      );
      const actual = Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(Function);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultSecretsManagerClientDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = pipe(
        unit.SecretsManagerClientDeps,
        Effect.map((deps) => deps.secretsManagerClient),
        unit.defaultSecretsManagerClientDeps({})
      );
      const actual = Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(SecretsManagerClient);
    });
  });

  // ------------------------------------------------------------------------
  describe('BatchGetSecretValueCommand', () => {
    beforeEach(() => {
      secretsManagerMock.reset();
    });

    it('should work as expected', async () => {
      secretsManagerMock.on(secretsManagerClient.BatchGetSecretValueCommand).resolves({
        SecretValues: [
          { Name: 'secret-1', SecretString: 'secret-value-1' },
          { Name: 'secret-2', SecretString: 'secret-value-2' },
        ],
        $metadata: { httpStatusCode: 200 },
      });

      const params: BatchGetSecretValueCommandInput = {
        SecretIdList: ['secret-id-1', 'secret-id-2'],
      };
      const expected = {
        SecretValues: [
          { Name: 'secret-1', SecretString: 'secret-value-1' },
          { Name: 'secret-2', SecretString: 'secret-value-2' },
        ],
        $metadata: { httpStatusCode: 200 },
        _Params: params,
      };
      const command = pipe(
        unit.BatchGetSecretValueCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(secretsManagerMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      secretsManagerMock
        .on(secretsManagerClient.BatchGetSecretValueCommand)
        .rejects({ $metadata: { httpStatusCode: 404 } });

      const params: BatchGetSecretValueCommandInput = {
        SecretIdList: ['secret-id-1', 'secret-id-2'],
      };
      const command = pipe(
        unit.BatchGetSecretValueCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(secretsManagerMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('CreateSecretCommand', () => {
    beforeEach(() => {
      secretsManagerMock.reset();
    });

    it('should work as expected', async () => {
      secretsManagerMock.on(secretsManagerClient.CreateSecretCommand).resolves({ $metadata: { httpStatusCode: 200 } });

      const params: CreateSecretCommandInput = {
        Name: 'secret-2',
        SecretString: 'secret-2',
      };
      const expected = { $metadata: { httpStatusCode: 200 }, _Params: params };
      const command = pipe(
        unit.CreateSecretCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(secretsManagerMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      secretsManagerMock.on(secretsManagerClient.CreateSecretCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: CreateSecretCommandInput = {
        Name: 'secret-2',
        SecretString: 'secret-2',
      };
      const command = pipe(
        unit.CreateSecretCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(secretsManagerMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('DeleteSecretCommand', () => {
    beforeEach(() => {
      secretsManagerMock.reset();
    });

    it('should work as expected', async () => {
      secretsManagerMock.on(secretsManagerClient.DeleteSecretCommand).resolves({ $metadata: { httpStatusCode: 200 } });

      const params: DeleteSecretCommandInput = {
        SecretId: 'secret-1',
      };
      const expected = { $metadata: { httpStatusCode: 200 }, _Params: params };
      const command = pipe(
        unit.DeleteSecretCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(secretsManagerMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      secretsManagerMock.on(secretsManagerClient.DeleteSecretCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: DeleteSecretCommandInput = {
        SecretId: 'secret-1',
      };
      const command = pipe(
        unit.DeleteSecretCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(secretsManagerMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('GetSecretValueCommand', () => {
    beforeEach(() => {
      secretsManagerMock.reset();
    });

    it('should work as expected', async () => {
      secretsManagerMock
        .on(secretsManagerClient.GetSecretValueCommand)
        .resolves({ Name: 'secret-1', SecretString: 'secret-value-1', $metadata: { httpStatusCode: 200 } });

      const params: GetSecretValueCommandInput = { SecretId: 'secret-1' };
      const expected = {
        Name: 'secret-1',
        SecretString: 'secret-value-1',
        $metadata: { httpStatusCode: 200 },
        _Params: params,
      };
      const command = pipe(
        unit.GetSecretValueCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(secretsManagerMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      secretsManagerMock.on(secretsManagerClient.GetSecretValueCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: GetSecretValueCommandInput = { SecretId: 'secret-1' };
      const command = pipe(
        unit.GetSecretValueCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(secretsManagerMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('ListSecretsCommand', () => {
    beforeEach(() => {
      secretsManagerMock.reset();
    });

    it('should work as expected', async () => {
      secretsManagerMock.on(secretsManagerClient.ListSecretsCommand).resolves({
        SecretList: [{ Name: 'secret-1' }, { Name: 'secret-2' }],
        $metadata: { httpStatusCode: 200 },
      });

      const params: ListSecretsCommandInput = { MaxResults: 10 };
      const expected = {
        SecretList: [{ Name: 'secret-1' }, { Name: 'secret-2' }],
        $metadata: { httpStatusCode: 200 },
        _Params: params,
      };
      const command = pipe(
        unit.ListSecretsCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(secretsManagerMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      secretsManagerMock.on(secretsManagerClient.ListSecretsCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: ListSecretsCommandInput = { MaxResults: 10 };
      const command = pipe(
        unit.ListSecretsCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(secretsManagerMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('PutSecretValueCommand', () => {
    beforeEach(() => {
      secretsManagerMock.reset();
    });

    it('should work as expected', async () => {
      secretsManagerMock.on(secretsManagerClient.PutSecretValueCommand).resolves({
        Name: 'secret-1',
        $metadata: { httpStatusCode: 201 },
      });

      const params: PutSecretValueCommandInput = {
        SecretId: 'secret-1',
        SecretString: 'new-secret-1',
      };
      const expected = {
        Name: 'secret-1',
        $metadata: { httpStatusCode: 201 },
        _Params: params,
      };
      const command = pipe(
        unit.PutSecretValueCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(secretsManagerMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      secretsManagerMock.on(secretsManagerClient.PutSecretValueCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: PutSecretValueCommandInput = {
        SecretId: 'secret-1',
        SecretString: 'new-secret-1',
      };
      const command = pipe(
        unit.PutSecretValueCommandEffect(params),
        Effect.provideService(SecretsManagerClientDeps, deps)
      );
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(secretsManagerMock.calls().length).toEqual(1);
    });
  });
});
