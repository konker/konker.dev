---
title: 'defaultDynamoDBDocClientFactoryDeps()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# defaultDynamoDBDocClientFactoryDeps()

```ts
function defaultDynamoDBDocClientFactoryDeps<A, E, R>(
  self
): Effect<A, E, Exclude<R, DynamoDBDocumentClientFactoryDeps>>;
```

## Type parameters

• **A**

• **E**

• **R**

## Parameters

• **self**: `Effect`\<`A`, `E`, `R`\>

## Returns

`Effect`\<`A`, `E`, `Exclude`\<`R`, [`DynamoDBDocumentClientFactoryDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbdocumentclientfactorydeps)\>\>

## Source

[src/index.ts:46](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L46)
