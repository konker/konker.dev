---
title: 'PutObjectCommandEffect()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# PutObjectCommandEffect()

```ts
function PutObjectCommandEffect(
  params,
  options?
): Effect<PutObjectCommandOutput & S3EchoParams<PutObjectCommandInput>, S3Error, S3ClientDeps>;
```

## Parameters

• **params**: `PutObjectCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`PutObjectCommandOutput` & [`S3EchoParams`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3echoparams)\<`PutObjectCommandInput`\>, `S3Error`, [`S3ClientDeps`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3clientdeps)\>

## Source

[src/index.ts:77](https://github.com/konkerdotdev/aws-client-effect-s3/blob/3f8e0eff075dd69bba1d17c99a6862f1e6b4d974/src/index.ts#L77)
