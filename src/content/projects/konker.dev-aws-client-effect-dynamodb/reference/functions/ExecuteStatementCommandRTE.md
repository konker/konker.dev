---
title: 'ExecuteStatementCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# ExecuteStatementCommandRTE()

```ts
function ExecuteStatementCommandRTE(
  params,
  options?
): Effect<
  Omit<ExecuteStatementCommandOutput, 'Items' | 'LastEvaluatedKey'> &
    object &
    DynamoDBEchoParams<ExecuteStatementCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `ExecuteStatementCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`ExecuteStatementCommandOutput`, `"Items"` \| `"LastEvaluatedKey"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`ExecuteStatementCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:173](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L173)
