---
title: 'BatchWriteCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# BatchWriteCommandRTE()

```ts
function BatchWriteCommandRTE(
  params,
  options?
): Effect<
  Omit<BatchWriteItemCommandOutput, 'UnprocessedItems' | 'ItemCollectionMetrics'> &
    object &
    DynamoDBEchoParams<BatchWriteCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `BatchWriteCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`BatchWriteItemCommandOutput`, `"UnprocessedItems"` \| `"ItemCollectionMetrics"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`BatchWriteCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:152](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L152)
