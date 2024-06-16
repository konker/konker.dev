---
title: 'ScanCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# ScanCommandRTE()

```ts
function ScanCommandRTE(
  params,
  options?
): Effect<
  Omit<ScanCommandOutput, 'Items' | 'LastEvaluatedKey'> & object & DynamoDBEchoParams<ScanCommandInput>,
  DynamoDbError,
  DynamoDBDocumentClientDeps
>;
```

## Parameters

• **params**: `ScanCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`Omit`\<`ScanCommandOutput`, `"Items"` \| `"LastEvaluatedKey"`\> & `object` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`ScanCommandInput`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:138](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L138)
