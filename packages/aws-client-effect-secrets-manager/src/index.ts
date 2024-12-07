import type { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import * as secretsManagerClient from '@aws-sdk/client-secrets-manager';
import type { Command, HttpHandlerOptions } from '@aws-sdk/types';
import * as P from '@konker.dev/effect-ts-prelude';
import type { SmithyResolvedConfiguration } from '@smithy/smithy-client/dist-types';

import type { SecretsManagerError } from './lib/error.js';
import { toSecretsManagerError } from './lib/error.js';

export { TAG as SECRETS_MANAGER_ERROR_TAG } from './lib/error.js';

export type SecretsManagerClientFactory = (
  config: secretsManagerClient.SecretsManagerClientConfig
) => secretsManagerClient.SecretsManagerClient;
export const defaultSecretsManagerClientFactory: SecretsManagerClientFactory = (
  config: secretsManagerClient.SecretsManagerClientConfig
) => new secretsManagerClient.SecretsManagerClient(config);

export type SecretsManagerClientFactoryDeps = {
  readonly secretsManagerClientFactory: SecretsManagerClientFactory;
};
export const SecretsManagerClientFactoryDeps = P.Context.GenericTag<SecretsManagerClientFactoryDeps>(
  '@aws-client-effect-secretsManager/SecretsManagerClientFactoryDeps'
);

export const defaultSecretsManagerClientFactoryDeps = P.Effect.provideService(
  SecretsManagerClientFactoryDeps,
  SecretsManagerClientFactoryDeps.of({
    secretsManagerClientFactory: defaultSecretsManagerClientFactory,
  })
);

//------------------------------------------------------
export type SecretsManagerClientDeps = {
  readonly secretsManagerClient: SecretsManagerClient;
};
export const SecretsManagerClientDeps = P.Context.GenericTag<SecretsManagerClientDeps>(
  'aws-client-effect-secretsManager/SecretsManagerClientDeps'
);

export const defaultSecretsManagerClientDeps = (config: secretsManagerClient.SecretsManagerClientConfig) =>
  P.Effect.provideService(
    SecretsManagerClientDeps,
    SecretsManagerClientDeps.of({
      secretsManagerClient: defaultSecretsManagerClientFactory(config),
    })
  );

// --------------------------------------------------------------------------
// Wrapper
export type SecretsManagerEchoParams<I> = { _Params: I };

export function FabricateCommandEffect<
  I extends secretsManagerClient.ServiceInputTypes,
  O extends secretsManagerClient.ServiceOutputTypes,
>(
  cmdCtor: new (
    params: I
  ) => Command<
    secretsManagerClient.ServiceInputTypes,
    I,
    secretsManagerClient.ServiceOutputTypes,
    O,
    SmithyResolvedConfiguration<HttpHandlerOptions>
  >
): (
  params: I,
  options?: HttpHandlerOptions | undefined
) => P.Effect.Effect<O & SecretsManagerEchoParams<I>, SecretsManagerError, SecretsManagerClientDeps> {
  return function (params, options) {
    return P.pipe(
      SecretsManagerClientDeps,
      P.Effect.flatMap((deps) =>
        P.Effect.tryPromise({
          try: async () => {
            const cmd = new cmdCtor(params);
            const result = await deps.secretsManagerClient.send(cmd, options);
            return { ...result, _Params: params };
          },
          catch: toSecretsManagerError(params),
        })
      )
    );
  };
}

// --------------------------------------------------------------------------
// BatchGetSecretValueCommand
export const BatchGetSecretValueCommandEffect = FabricateCommandEffect<
  secretsManagerClient.BatchGetSecretValueCommandInput,
  secretsManagerClient.BatchGetSecretValueCommandOutput
>(secretsManagerClient.BatchGetSecretValueCommand);

// --------------------------------------------------------------------------
// CreateSecretCommand
export const CreateSecretCommandEffect = FabricateCommandEffect<
  secretsManagerClient.CreateSecretCommandInput,
  secretsManagerClient.CreateSecretCommandOutput
>(secretsManagerClient.CreateSecretCommand);

// --------------------------------------------------------------------------
// DeleteSecretCommand
export const DeleteSecretCommandEffect = FabricateCommandEffect<
  secretsManagerClient.DeleteSecretCommandInput,
  secretsManagerClient.DeleteSecretCommandOutput
>(secretsManagerClient.DeleteSecretCommand);

// --------------------------------------------------------------------------
// GetSecretValueCommand
export const GetSecretValueCommandEffect = FabricateCommandEffect<
  secretsManagerClient.GetSecretValueCommandInput,
  secretsManagerClient.GetSecretValueCommandOutput
>(secretsManagerClient.GetSecretValueCommand);

// --------------------------------------------------------------------------
// PutSecretValueCommand
export const PutSecretValueCommandEffect = FabricateCommandEffect<
  secretsManagerClient.PutSecretValueCommandInput,
  secretsManagerClient.PutSecretValueCommandOutput
>(secretsManagerClient.PutSecretValueCommand);

// --------------------------------------------------------------------------
// ListSecretsCommand
export const ListSecretsCommandEffect = FabricateCommandEffect<
  secretsManagerClient.ListSecretsCommandInput,
  secretsManagerClient.ListSecretsCommandOutput
>(secretsManagerClient.ListSecretsCommand);
