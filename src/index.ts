import * as P from '@konker.dev/effect-ts-prelude';

import type { SQSClient } from '@aws-sdk/client-sqs';
import * as sqsClient from '@aws-sdk/client-sqs';
import type { Command, HttpHandlerOptions } from '@aws-sdk/types';
import type { SmithyResolvedConfiguration } from '@smithy/smithy-client/dist-types';

import type { SqsError } from './lib/error';
import { toSqsError } from './lib/error';

export { TAG as SQS_ERROR_TAG } from './lib/error';

export type SQSClientFactory = (config: sqsClient.SQSClientConfig) => sqsClient.SQSClient;
export const defaultSQSClientFactory: SQSClientFactory = (config: sqsClient.SQSClientConfig) =>
  new sqsClient.SQSClient(config);

export type SQSClientFactoryDeps = {
  readonly sqsClientFactory: SQSClientFactory;
};
export const SQSClientFactoryDeps = P.Context.GenericTag<SQSClientFactoryDeps>(
  '@aws-client-effect-sqs/SQSClientFactoryDeps'
);

export const defaultSQSClientFactoryDeps = P.Effect.provideService(
  SQSClientFactoryDeps,
  SQSClientFactoryDeps.of({
    sqsClientFactory: defaultSQSClientFactory,
  })
);

//------------------------------------------------------
export type SQSClientDeps = {
  readonly sqsClient: SQSClient;
};
export const SQSClientDeps = P.Context.GenericTag<SQSClientDeps>('aws-client-effect-sqs/SQSClientDeps');

export type SQSEchoParams<I> = { _Params: I };

// --------------------------------------------------------------------------
// Wrapper
export function FabricateCommandEffect<I extends sqsClient.ServiceInputTypes, O extends sqsClient.ServiceOutputTypes>(
  cmdCtor: new (
    params: I
  ) => Command<
    sqsClient.ServiceInputTypes,
    I,
    sqsClient.ServiceOutputTypes,
    O,
    SmithyResolvedConfiguration<HttpHandlerOptions>
  >
): (
  params: I,
  options?: HttpHandlerOptions | undefined
) => P.Effect.Effect<O & SQSEchoParams<I>, SqsError, SQSClientDeps> {
  return function (params, options) {
    return P.pipe(
      SQSClientDeps,
      P.Effect.flatMap((deps) =>
        P.Effect.tryPromise({
          try: async () => {
            const cmd = new cmdCtor(params);
            const result = await deps.sqsClient.send(cmd, options);
            return { ...result, _Params: params };
          },
          catch: toSqsError(params),
        })
      )
    );
  };
}

// --------------------------------------------------------------------------
// ChangeMessageVisibilityCommand
export const ChangeMessageVisibilityCommandEffect = FabricateCommandEffect<
  sqsClient.ChangeMessageVisibilityCommandInput,
  sqsClient.ChangeMessageVisibilityCommandOutput
>(sqsClient.ChangeMessageVisibilityCommand);

// --------------------------------------------------------------------------
// DeleteMessageCommand
export const DeleteMessageCommandEffect = FabricateCommandEffect<
  sqsClient.DeleteMessageCommandInput,
  sqsClient.DeleteMessageCommandOutput
>(sqsClient.DeleteMessageCommand);

// --------------------------------------------------------------------------
// DeleteMessageBatchCommand
export const DeleteMessageBatchCommandEffect = FabricateCommandEffect<
  sqsClient.DeleteMessageBatchCommandInput,
  sqsClient.DeleteMessageBatchCommandOutput
>(sqsClient.DeleteMessageBatchCommand);

// --------------------------------------------------------------------------
// ReceiveMessageCommand
export const ReceiveMessageCommandEffect = FabricateCommandEffect<
  sqsClient.ReceiveMessageCommandInput,
  sqsClient.ReceiveMessageCommandOutput
>(sqsClient.ReceiveMessageCommand);

// --------------------------------------------------------------------------
// SendMessageCommand
export const SendMessageCommandEffect = FabricateCommandEffect<
  sqsClient.SendMessageCommandInput,
  sqsClient.SendMessageCommandOutput
>(sqsClient.SendMessageCommand);
