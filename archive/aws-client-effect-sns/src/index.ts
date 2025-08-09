import type { SNSClient } from '@aws-sdk/client-sns';
import * as snsClient from '@aws-sdk/client-sns';
import type { Command, HttpHandlerOptions } from '@aws-sdk/types';
import type { SmithyResolvedConfiguration } from '@smithy/smithy-client/dist-types';
import { Context, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { SnsError } from './lib/error.js';
import { toSnsError } from './lib/error.js';

export { TAG as SNS_ERROR_TAG } from './lib/error.js';

//------------------------------------------------------
export type SNSClientFactory = (config: snsClient.SNSClientConfig) => snsClient.SNSClient;
export const defaultSNSClientFactory: SNSClientFactory = (config: snsClient.SNSClientConfig) =>
  new snsClient.SNSClient(config);

export type SNSClientFactoryDeps = {
  readonly snsClientFactory: SNSClientFactory;
};
export const SNSClientFactoryDeps = Context.GenericTag<SNSClientFactoryDeps>(
  '@aws-client-client-sns/SNSClientFactoryDeps'
);

export const defaultSNSClientFactoryDeps = Effect.provideService(
  SNSClientFactoryDeps,
  SNSClientFactoryDeps.of({
    snsClientFactory: defaultSNSClientFactory,
  })
);

//------------------------------------------------------
export type SNSClientDeps = {
  readonly snsClient: SNSClient;
};
export const SNSClientDeps = Context.GenericTag<SNSClientDeps>('aws-client-effect-sns/SNSClientDeps');

export const defaultSNSClientDeps = (config: snsClient.SNSClientConfig) =>
  Effect.provideService(
    SNSClientDeps,
    SNSClientDeps.of({
      snsClient: defaultSNSClientFactory(config),
    })
  );

// --------------------------------------------------------------------------
// Wrapper
export type SNSEchoParams<I> = { _Params: I };

export function FabricateCommandEffect<I extends snsClient.ServiceInputTypes, O extends snsClient.ServiceOutputTypes>(
  cmdCtor: new (
    params: I
  ) => Command<
    snsClient.ServiceInputTypes,
    I,
    snsClient.ServiceOutputTypes,
    O,
    SmithyResolvedConfiguration<HttpHandlerOptions>
  >
): (
  params: I,
  options?: HttpHandlerOptions | undefined
) => Effect.Effect<O & SNSEchoParams<I>, SnsError, SNSClientDeps> {
  return function (params, options) {
    return pipe(
      SNSClientDeps,
      Effect.flatMap((deps) =>
        Effect.tryPromise({
          try: async () => {
            const cmd = new cmdCtor(params);
            const result = await deps.snsClient.send(cmd, options);
            return { ...result, _Params: params };
          },
          catch: toSnsError(params),
        })
      )
    );
  };
}

// --------------------------------------------------------------------------
// PublishCommand
export const PublishCommandEffect = FabricateCommandEffect<
  snsClient.PublishCommandInput,
  snsClient.PublishCommandOutput
>(snsClient.PublishCommand);
