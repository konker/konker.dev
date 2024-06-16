---
title: 'HeadObjectCommandEffect()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# HeadObjectCommandEffect()

```ts
function HeadObjectCommandEffect(
  params,
  options?
): Effect<HeadObjectCommandOutput & S3EchoParams<HeadObjectCommandInput>, S3Error, S3ClientDeps>;
```

## Parameters

• **params**: `HeadObjectCommandInput`

• **options?**: `HttpHandlerOptions`

## Returns

`Effect`\<`HeadObjectCommandOutput` & [`S3EchoParams`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3echoparams)\<`HeadObjectCommandInput`\>, `S3Error`, [`S3ClientDeps`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3clientdeps)\>

## Source

[src/index.ts:84](https://github.com/konkerdotdev/aws-client-effect-s3/blob/3f8e0eff075dd69bba1d17c99a6862f1e6b4d974/src/index.ts#L84)
