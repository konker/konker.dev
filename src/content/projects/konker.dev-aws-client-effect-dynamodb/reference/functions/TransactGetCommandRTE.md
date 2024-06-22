---
title: 'TransactGetCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# TransactGetCommandRTE()

```ts
function TransactGetCommandRTE(
  params,
  options?
): Effect<
  Omit<TransactGetItemsCommandOutput, 'Responses'> & object & DynamoDBEchoParams<TransactGetCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `TransactGetCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`TransactGetItemsCommandOutput`, `"Responses"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`TransactGetCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:159](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L159)
