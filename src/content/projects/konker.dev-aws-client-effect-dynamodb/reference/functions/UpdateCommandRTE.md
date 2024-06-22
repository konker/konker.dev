---
title: 'UpdateCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# UpdateCommandRTE()

```ts
function UpdateCommandRTE(
  params,
  options?
): Effect<
  Omit<UpdateItemCommandOutput, 'ItemCollectionMetrics' | 'Attributes'> &
    object &
    DynamoDBEchoParams<UpdateCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `UpdateCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`UpdateItemCommandOutput`, `"ItemCollectionMetrics"` \| `"Attributes"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`UpdateCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:117](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L117)
