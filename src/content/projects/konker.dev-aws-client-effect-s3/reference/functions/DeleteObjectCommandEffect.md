---
title: 'DeleteObjectCommandEffect()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# DeleteObjectCommandEffect()

```ts
function DeleteObjectCommandEffect(
  params,
  options?
): Effect<DeleteObjectCommandOutput & S3EchoParams<DeleteObjectCommandInput>, S3Error, S3ClientDeps>;
```

## Parameters

• **params**: `DeleteObjectCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`DeleteObjectCommandOutput` & [`S3EchoParams`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3echoparams)\<`DeleteObjectCommandInput`\>, `S3Error`, [`S3ClientDeps`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3clientdeps)\>

## Source

[src/index.ts:91](https://github.com/konkerdotdev/aws-client-effect-s3/blob/3f8e0eff075dd69bba1d17c99a6862f1e6b4d974/src/index.ts#L91)
