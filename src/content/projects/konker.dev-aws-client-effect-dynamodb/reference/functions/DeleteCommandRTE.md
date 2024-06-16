---
title: 'DeleteCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# DeleteCommandRTE()

```ts
function DeleteCommandRTE(
  params,
  options?
): Effect<
  Omit<DeleteItemCommandOutput, 'ItemCollectionMetrics' | 'Attributes'> &
    object &
    DynamoDBEchoParams<DeleteCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `DeleteCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`DeleteItemCommandOutput`, `"ItemCollectionMetrics"` \| `"Attributes"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`DeleteCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:124](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L124)
