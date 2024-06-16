---
title: 'FabricateCommandEffect()'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 1
kind: reference
---

# FabricateCommandEffect()

```ts
function FabricateCommandEffect<I, O>(
  cmdCtor
): (params, options?) => P.Effect.Effect<O & S3EchoParams<I>, S3Error, S3ClientDeps>;
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

`P.Effect.Effect`\<`O` & [`S3EchoParams`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3echoparams)\<`I`\>, `S3Error`, [`S3ClientDeps`](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3clientdeps)\>

## Source

[src/index.ts:37](https://github.com/konkerdotdev/aws-client-effect-s3/blob/3f8e0eff075dd69bba1d17c99a6862f1e6b4d974/src/index.ts#L37)
