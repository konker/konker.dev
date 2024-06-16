---
title: 'GetCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# GetCommandRTE()

```ts
function GetCommandRTE(
  params,
  options?
): Effect<
  Omit<GetItemCommandOutput, 'Item'> & object & DynamoDBEchoParams<GetCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `GetCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`GetItemCommandOutput`, `"Item"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`GetCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:105](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L105)
