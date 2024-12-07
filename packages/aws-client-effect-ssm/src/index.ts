import type { SSMClient } from '@aws-sdk/client-ssm';
import * as ssmClient from '@aws-sdk/client-ssm';
import type { Command, HttpHandlerOptions } from '@aws-sdk/types';
import * as P from '@konker.dev/effect-ts-prelude';
import type { SmithyResolvedConfiguration } from '@smithy/smithy-client/dist-types';

import type { SsmError } from './lib/error.js';
import { toSsmError } from './lib/error.js';

export { TAG as SSM_ERROR_TAG } from './lib/error.js';

export type SSMClientFactory = (config: ssmClient.SSMClientConfig) => ssmClient.SSMClient;
export const defaultSSMClientFactory: SSMClientFactory = (config: ssmClient.SSMClientConfig) =>
  new ssmClient.SSMClient(config);

export type SSMClientFactoryDeps = {
  readonly ssmClientFactory: SSMClientFactory;
};
export const SSMClientFactoryDeps = P.Context.GenericTag<SSMClientFactoryDeps>(
  '@aws-client-effect-ssm/SSMClientFactoryDeps'
);

export const defaultSSMClientFactoryDeps = P.Effect.provideService(
  SSMClientFactoryDeps,
  SSMClientFactoryDeps.of({
    ssmClientFactory: defaultSSMClientFactory,
  })
);

//------------------------------------------------------
export type SSMClientDeps = {
  readonly ssmClient: SSMClient;
};
export const SSMClientDeps = P.Context.GenericTag<SSMClientDeps>('aws-client-effect-ssm/SSMClientDeps');

export const defaultSSMClientDeps = (config: ssmClient.SSMClientConfig) =>
  P.Effect.provideService(
    SSMClientDeps,
    SSMClientDeps.of({
      ssmClient: defaultSSMClientFactory(config),
    })
  );

// --------------------------------------------------------------------------
// Wrapper
export type SSMEchoParams<I> = { _Params: I };

export function FabricateCommandEffect<I extends ssmClient.ServiceInputTypes, O extends ssmClient.ServiceOutputTypes>(
  cmdCtor: new (
    params: I
  ) => Command<
    ssmClient.ServiceInputTypes,
    I,
    ssmClient.ServiceOutputTypes,
    O,
    SmithyResolvedConfiguration<HttpHandlerOptions>
  >
): (
  params: I,
  options?: HttpHandlerOptions | undefined
) => P.Effect.Effect<O & SSMEchoParams<I>, SsmError, SSMClientDeps> {
  return function (params, options) {
    return P.pipe(
      SSMClientDeps,
      P.Effect.flatMap((deps) =>
        P.Effect.tryPromise({
          try: async () => {
            const cmd = new cmdCtor(params);
            const result = await deps.ssmClient.send(cmd, options);
            return { ...result, _Params: params };
          },
          catch: toSsmError(params),
        })
      )
    );
  };
}

// --------------------------------------------------------------------------
// GetParameterCommand
export const GetParameterCommandEffect = FabricateCommandEffect<
  ssmClient.GetParameterCommandInput,
  ssmClient.GetParameterCommandOutput
>(ssmClient.GetParameterCommand);

// --------------------------------------------------------------------------
// GetParametersCommand
export const GetParametersCommandEffect = FabricateCommandEffect<
  ssmClient.GetParametersCommandInput,
  ssmClient.GetParametersCommandOutput
>(ssmClient.GetParametersCommand);

// --------------------------------------------------------------------------
// GetParametersByPathCommand
export const GetParametersByPathCommandEffect = FabricateCommandEffect<
  ssmClient.GetParametersByPathCommandInput,
  ssmClient.GetParametersByPathCommandOutput
>(ssmClient.GetParametersByPathCommand);

// --------------------------------------------------------------------------
// PutParameterCommand
export const PutParameterCommandEffect = FabricateCommandEffect<
  ssmClient.PutParameterCommandInput,
  ssmClient.PutParameterCommandOutput
>(ssmClient.PutParameterCommand);

// --------------------------------------------------------------------------
// DeleteParameterCommand
export const DeleteParameterCommandEffect = FabricateCommandEffect<
  ssmClient.DeleteParameterCommandInput,
  ssmClient.DeleteParameterCommandOutput
>(ssmClient.DeleteParameterCommand);

// --------------------------------------------------------------------------
// DeleteParametersCommand
export const DeleteParametersCommandEffect = FabricateCommandEffect<
  ssmClient.DeleteParametersCommandInput,
  ssmClient.DeleteParametersCommandOutput
>(ssmClient.DeleteParametersCommand);
