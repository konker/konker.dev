---
title: 'BatchGetCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# BatchGetCommandRTE()

```ts
function BatchGetCommandRTE(
  params,
  options?
): Effect<
  Omit<BatchGetItemCommandOutput, 'Responses' | 'UnprocessedKeys'> & object & DynamoDBEchoParams<BatchGetCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `BatchGetCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`BatchGetItemCommandOutput`, `"Responses"` \| `"UnprocessedKeys"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`BatchGetCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:145](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L145)
