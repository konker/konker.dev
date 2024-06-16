---
title: 'defaultDynamoDBFactoryDeps()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# defaultDynamoDBFactoryDeps()

```ts
function defaultDynamoDBFactoryDeps<A, E, R>(self): Effect<A, E, Exclude<R, DynamoDBFactoryDeps>>;
```

## Type parameters

• **A**

• **E**

• **R**

## Parameters

• **self**: `Effect`\<`A`, `E`, `R`\>

## Returns

`Effect`\<`A`, `E`, `Exclude`\<`R`, [`DynamoDBFactoryDeps`](/projects/konkerdev-aws-client-effect-dynamodb/reference/type-aliases/dynamodbfactorydeps)\>\>

## Source

[src/index.ts:31](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L31)
