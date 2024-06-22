---
title: 'Reference'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 4
kind: reference
---

# Reference

## Type Aliases

| Type alias                                                                                         | Description |
| :------------------------------------------------------------------------------------------------- | :---------- |
| [S3ClientDeps](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3clientdeps)       | -           |
| [S3ClientFactory](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3clientfactory) | -           |
| [S3EchoParams](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3echoparams)       | -           |
| [S3FactoryDeps](/projects/konkerdev-aws-client-effect-s3/reference/type-aliases/s3factorydeps)     | -           |

## Functions

| Function                                                                                                              | Description |
| :-------------------------------------------------------------------------------------------------------------------- | :---------- |
| [DeleteObjectCommandEffect](/projects/konkerdev-aws-client-effect-s3/reference/functions/deleteobjectcommandeffect)   | -           |
| [FabricateCommandEffect](/projects/konkerdev-aws-client-effect-s3/reference/functions/fabricatecommandeffect)         | -           |
| [GetObjectCommandEffect](/projects/konkerdev-aws-client-effect-s3/reference/functions/getobjectcommandeffect)         | -           |
| [HeadObjectCommandEffect](/projects/konkerdev-aws-client-effect-s3/reference/functions/headobjectcommandeffect)       | -           |
| [ListObjectsV2CommandEffect](/projects/konkerdev-aws-client-effect-s3/reference/functions/listobjectsv2commandeffect) | -           |
| [PutObjectCommandEffect](/projects/konkerdev-aws-client-effect-s3/reference/functions/putobjectcommandeffect)         | -           |
| [defaultS3ClientFactory](/projects/konkerdev-aws-client-effect-s3/reference/functions/defaults3clientfactory)         | -           |
| [defaultS3FactoryDeps](/projects/konkerdev-aws-client-effect-s3/reference/functions/defaults3factorydeps)             | -           |

## Variables

### S3ClientDeps

```ts
S3ClientDeps: Tag<S3ClientDeps, S3ClientDeps>;
```

#### Source

[src/index.ts:28](https://github.com/konkerdotdev/aws-client-effect-s3/blob/3f8e0eff075dd69bba1d17c99a6862f1e6b4d974/src/index.ts#L28)

---

### S3FactoryDeps

```ts
S3FactoryDeps: Tag<S3FactoryDeps, S3FactoryDeps>;
```

#### Source

[src/index.ts:15](https://github.com/konkerdotdev/aws-client-effect-s3/blob/3f8e0eff075dd69bba1d17c99a6862f1e6b4d974/src/index.ts#L15)

---

### S3_ERROR_TAG

```ts
const S3_ERROR_TAG: '@konker.dev/aws-client-effect-s3/S3Error' = '@konker.dev/aws-client-effect-s3/S3Error';
```

#### Source

[src/lib/error.ts:1](https://github.com/konkerdotdev/aws-client-effect-s3/blob/3f8e0eff075dd69bba1d17c99a6862f1e6b4d974/src/lib/error.ts#L1)
