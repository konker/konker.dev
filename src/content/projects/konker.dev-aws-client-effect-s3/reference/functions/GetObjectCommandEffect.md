---
title: 'GetObjectCommandEffect()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# GetObjectCommandEffect()

```ts
function GetObjectCommandEffect(
  params,
  options?
): Effect<GetObjectCommandOutput & S3EchoParams<GetObjectCommandInput>, S3Error, S3ClientDeps>;
```

## Parameters

• **params**: `GetObjectCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`GetObjectCommandOutput` & [`S3EchoParams`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3echoparams)\<`GetObjectCommandInput`\>, `S3Error`, [`S3ClientDeps`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3clientdeps)\>

## Source

[src/index.ts:70](https://github.com/konkerdotdev/aws-client-effect-s3/blob/3f8e0eff075dd69bba1d17c99a6862f1e6b4d974/src/index.ts#L70)
