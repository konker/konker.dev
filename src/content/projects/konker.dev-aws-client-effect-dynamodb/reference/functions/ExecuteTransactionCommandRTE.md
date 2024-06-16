---
title: 'ExecuteTransactionCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# ExecuteTransactionCommandRTE()

```ts
function ExecuteTransactionCommandRTE(
  params,
  options?
): Effect<
  Omit<ExecuteTransactionCommandOutput, 'Responses'> & object & DynamoDBEchoParams<ExecuteTransactionCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `ExecuteTransactionCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`ExecuteTransactionCommandOutput`, `"Responses"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`ExecuteTransactionCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:180](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L180)
