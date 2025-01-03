---
title: 'TransactWriteCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# TransactWriteCommandRTE()

```ts
function TransactWriteCommandRTE(
  params,
  options?
): Effect<
  Omit<TransactWriteItemsCommandOutput, 'ItemCollectionMetrics'> &
    object &
    DynamoDBEchoParams<TransactWriteCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `TransactWriteCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`TransactWriteItemsCommandOutput`, `"ItemCollectionMetrics"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`TransactWriteCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:166](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L166)
