---
title: 'TinyFileSystemWithGlob'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 2
kind: reference
---

# TinyFileSystemWithGlob

```ts
type TinyFileSystemWithGlob<T>: T & object;
```

## Type declaration

### glob()

```ts
readonly glob: (dirPath) => P.Effect.Effect<Ref[], TinyFileSystemError>;
```

#### Parameters

• **dirPath**: `string`

#### Returns

`P.Effect.Effect`\<[`Ref`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/ref)[], [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

## Type parameters

• **T** _extends_ [`TinyFileSystem`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystem) = [`TinyFileSystem`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystem)

## Source

[src/index.ts:182](https://github.com/konkerdotdev/tiny-filesystem-fp/blob/900743fd8cf49d9e7c3831c08b0b3c0dd3e06fb2/src/index.ts#L182)
