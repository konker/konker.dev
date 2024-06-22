---
title: 'DynamoDBDocumentClientDeps'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 5
kind: reference
---

# DynamoDBDocumentClientDeps

```ts
type DynamoDBDocumentClientDeps: object;
```

## Type declaration

### dynamoDBClient

```ts
readonly dynamoDBClient: P.LazyArg<dynamodb.DynamoDBClient>;
```

### dynamoDBDocumentClient

```ts
readonly dynamoDBDocumentClient: P.LazyArg<Client<dynamodbDocClient.ServiceInputTypes, dynamodbDocClient.ServiceOutputTypes, unknown>>;
```

## Source

[src/index.ts:55](https://github.com/konkerdotdev/aws-client-effect-dynamodb/blob/61cc23ece48bc14ff19d7990e27b716d0c6ee7ed/src/index.ts#L55)
