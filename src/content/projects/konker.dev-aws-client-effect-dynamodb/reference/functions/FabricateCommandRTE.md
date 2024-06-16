---
title: 'FabricateCommandRTE()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# FabricateCommandRTE()

```ts
function FabricateCommandRTE<I, O>(
  cmdCtor
): (params, options?) => P.Effect.Effect<O & DynamoDBEchoParams<I>, DynamoDbError, DynamoDBDocumentClientDeps>;
```

## Type parameters

• **I** _extends_ `ServiceInputTypes`

• **O** _extends_ `ServiceOutputTypes`

## Parameters

• **cmdCtor**

## Returns

`Function`

### Parameters

• **params**: `I`

• **options?**: `HttpHandlerOptions`

### Returns

`P.Effect.Effect`\<`O` & [`DynamoDBEchoParams`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbechoparams)\<`I`\>, `DynamoDbError`, [`DynamoDBDocumentClientDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientdeps)\>

## Source

[src/index.ts:69](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L69)
