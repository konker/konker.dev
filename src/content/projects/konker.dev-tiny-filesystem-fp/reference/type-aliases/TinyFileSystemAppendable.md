---
title: 'TinyFileSystemAppendable'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 2
kind: reference
---

# TinyFileSystemAppendable

```ts
type TinyFileSystemAppendable<T>: T & object;
```

## Type declaration

### getFileAppendWriteStream()

```ts
readonly getFileAppendWriteStream: (filePath) => P.Effect.Effect<Writable, TinyFileSystemError>;
```

#### Parameters

• **filePath**: `string`

#### Returns

`P.Effect.Effect`\<`Writable`, [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

## Type parameters

• **T** _extends_ [`TinyFileSystem`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystem) = [`TinyFileSystem`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystem)

## Source

[src/index.ts:178](https://github.com/konkerdotdev/tiny-filesystem-fp/blob/900743fd8cf49d9e7c3831c08b0b3c0dd3e06fb2/src/index.ts#L178)
