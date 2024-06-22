---
title: 'ListObjectsV2CommandEffect()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 6
kind: reference
---

# ListObjectsV2CommandEffect()

```ts
function ListObjectsV2CommandEffect(
  params,
  options?
): Effect<ListObjectsV2CommandOutput & S3EchoParams<ListObjectsV2CommandInput>, S3Error, S3ClientDeps>;
```

## Parameters

• **params**: `ListObjectsV2CommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`ListObjectsV2CommandOutput` & [`S3EchoParams`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3echoparams)\<`ListObjectsV2CommandInput`\>, `S3Error`, [`S3ClientDeps`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3clientdeps)\>

## Source

[src/index.ts:98](https://github.com/konkerdotdev/aws-client-effect-s3/blob/3f8e0eff075dd69bba1d17c99a6862f1e6b4d974/src/index.ts#L98)
