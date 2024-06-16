---
title: 'defaultS3FactoryDeps()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# defaultS3FactoryDeps()

```ts
function defaultS3FactoryDeps<A, E, R>(self): Effect<A, E, Exclude<R, S3FactoryDeps>>;
```

## Type parameters

• **A**

• **E**

• **R**

## Parameters

• **self**: `Effect`\<`A`, `E`, `R`\>

## Returns

`Effect`\<`A`, `E`, `Exclude`\<`R`, [`S3FactoryDeps`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3factorydeps)\>\>

## Source

[src/index.ts:20](https://github.com/konkerdotdev/aws-client-effect-s3/blob/3f8e0eff075dd69bba1d17c99a6862f1e6b4d974/src/index.ts#L20)
