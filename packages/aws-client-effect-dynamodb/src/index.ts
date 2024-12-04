import * as P from '@konker.dev/effect-ts-prelude';

import * as dynamodbDocClient from '@aws-sdk/lib-dynamodb';
import type { Command, HandlerOptions, HttpHandlerOptions } from '@aws-sdk/types';
import type { SmithyResolvedConfiguration } from '@smithy/smithy-client/dist-types';

import { DynamoDBDocumentClientDeps } from './lib/client';
import type { DynamoDbError } from './lib/error';
import { toDynamoDbError } from './lib/error';

// --------------------------------------------------------------------------
export type DynamoDBEchoParams<I> = { _Params: I };

// Wrapper
export function FabricateCommandEffect<
  I extends dynamodbDocClient.ServiceInputTypes,
  O extends dynamodbDocClient.ServiceOutputTypes,
>(
  cmdCtor: new (
    params: I
  ) => Command<
    dynamodbDocClient.ServiceInputTypes,
    I,
    dynamodbDocClient.ServiceOutputTypes,
    O,
    SmithyResolvedConfiguration<HandlerOptions>
  >
): (
  params: I,
  options?: HttpHandlerOptions | undefined
) => P.Effect.Effect<O & DynamoDBEchoParams<I>, DynamoDbError, DynamoDBDocumentClientDeps> {
  return function (params, options) {
    return P.pipe(
      DynamoDBDocumentClientDeps,
      P.Effect.flatMap((deps) =>
        P.Effect.tryPromise({
          try: async () => {
            const cmd = new cmdCtor(params);
            const result = await deps.dynamoDBDocumentClient.send(cmd, options);
            return { ...result, _Params: params };
          },
          catch: toDynamoDbError(params),
        })
      )
    );
  };
}

// --------------------------------------------------------------------------
// GetCommand
export const GetCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.GetCommandInput,
  dynamodbDocClient.GetCommandOutput
>(dynamodbDocClient.GetCommand);

// --------------------------------------------------------------------------
// PutCommand
export const PutCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.PutCommandInput,
  dynamodbDocClient.PutCommandOutput
>(dynamodbDocClient.PutCommand);

// --------------------------------------------------------------------------
// UpdateCommand
export const UpdateCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.UpdateCommandInput,
  dynamodbDocClient.UpdateCommandOutput
>(dynamodbDocClient.UpdateCommand);

// --------------------------------------------------------------------------
// DeleteCommand
export const DeleteCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.DeleteCommandInput,
  dynamodbDocClient.DeleteCommandOutput
>(dynamodbDocClient.DeleteCommand);

// --------------------------------------------------------------------------
// QueryCommand
export const QueryCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.QueryCommandInput,
  dynamodbDocClient.QueryCommandOutput
>(dynamodbDocClient.QueryCommand);

// --------------------------------------------------------------------------
// ScanCommand
export const ScanCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.ScanCommandInput,
  dynamodbDocClient.ScanCommandOutput
>(dynamodbDocClient.ScanCommand);

// --------------------------------------------------------------------------
// BatchGetCommand
export const BatchGetCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.BatchGetCommandInput,
  dynamodbDocClient.BatchGetCommandOutput
>(dynamodbDocClient.BatchGetCommand);

// --------------------------------------------------------------------------
// BatchWriteCommand
export const BatchWriteCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.BatchWriteCommandInput,
  dynamodbDocClient.BatchWriteCommandOutput
>(dynamodbDocClient.BatchWriteCommand);

// --------------------------------------------------------------------------
// TransactGetCommand
export const TransactGetCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.TransactGetCommandInput,
  dynamodbDocClient.TransactGetCommandOutput
>(dynamodbDocClient.TransactGetCommand);

// --------------------------------------------------------------------------
// TransactWriteCommand
export const TransactWriteCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.TransactWriteCommandInput,
  dynamodbDocClient.TransactWriteCommandOutput
>(dynamodbDocClient.TransactWriteCommand);

// --------------------------------------------------------------------------
// ExecuteStatementCommand
export const ExecuteStatementCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.ExecuteStatementCommandInput,
  dynamodbDocClient.ExecuteStatementCommandOutput
>(dynamodbDocClient.ExecuteStatementCommand);

// --------------------------------------------------------------------------
// ExecuteTransactionCommand
export const ExecuteTransactionCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.ExecuteTransactionCommandInput,
  dynamodbDocClient.ExecuteTransactionCommandOutput
>(dynamodbDocClient.ExecuteTransactionCommand);

// --------------------------------------------------------------------------
// BatchExecuteStatementCommand
export const BatchExecuteStatementCommandEffect = FabricateCommandEffect<
  dynamodbDocClient.BatchExecuteStatementCommandInput,
  dynamodbDocClient.BatchExecuteStatementCommandOutput
>(dynamodbDocClient.BatchExecuteStatementCommand);
