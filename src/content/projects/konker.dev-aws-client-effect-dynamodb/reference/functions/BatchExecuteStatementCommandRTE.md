---
title: 'BatchExecuteStatementCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# BatchExecuteStatementCommandRTE()

```ts
function BatchExecuteStatementCommandRTE(
  params,
  options?
): Effect<
  Omit<BatchExecuteStatementCommandOutput, 'Responses'> &
    object &
    DynamoDBEchoParams<BatchExecuteStatementCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `BatchExecuteStatementCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`BatchExecuteStatementCommandOutput`, `"Responses"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`BatchExecuteStatementCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:187](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L187)
