---
title: 'Reference'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 4
kind: reference
---

# Reference

## Enumerations

| Enumeration                                                                        | Description |
| :--------------------------------------------------------------------------------- | :---------- |
| [FileType](/projects/konkerdev-tiny-filesystem-fp/reference/enumerations/filetype) | -           |

## Type Aliases

| Type alias                                                                                                         | Description |
| :----------------------------------------------------------------------------------------------------------------- | :---------- |
| [DirectoryPath](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/directorypath)                       | -           |
| [FileName](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/filename)                                 | -           |
| [FileTypeS](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/filetypes)                               | -           |
| [IoUrl](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/iourl)                                       | -           |
| [MemFsTinyFileSystem](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/memfstinyfilesystem)           | -           |
| [Path](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/path)                                         | -           |
| [Ref](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/ref)                                           | -           |
| [S3TinyFileSystem](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/s3tinyfilesystem)                 | -           |
| [TinyFileSystem](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystem)                     | -           |
| [TinyFileSystemAppendable](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemappendable) | -           |
| [TinyFileSystemError](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)           | -           |
| [TinyFileSystemWithGlob](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemwithglob)     | -           |

## Functions

| Function                                                                                                  | Description                                                                                             |
| :-------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| [DirectoryPath](/projects/konkerdev-tiny-filesystem-fp/reference/functions/directorypath)                 | Constructs a branded type from a value of type `A`, throwing an error if the provided `A` is not valid. |
| [FileName](/projects/konkerdev-tiny-filesystem-fp/reference/functions/filename)                           | Constructs a branded type from a value of type `A`, throwing an error if the provided `A` is not valid. |
| [IoUrl](/projects/konkerdev-tiny-filesystem-fp/reference/functions/iourl)                                 | Constructs a branded type from a value of type `A`, throwing an error if the provided `A` is not valid. |
| [MemFsTinyFileSystem](/projects/konkerdev-tiny-filesystem-fp/reference/functions/memfstinyfilesystem)     | -                                                                                                       |
| [S3TinyFileSystem](/projects/konkerdev-tiny-filesystem-fp/reference/functions/s3tinyfilesystem)           | -                                                                                                       |
| [fileTypeIsDirectory](/projects/konkerdev-tiny-filesystem-fp/reference/functions/filetypeisdirectory)     | -                                                                                                       |
| [fileTypeIsFile](/projects/konkerdev-tiny-filesystem-fp/reference/functions/filetypeisfile)               | -                                                                                                       |
| [fileTypeIsOther](/projects/konkerdev-tiny-filesystem-fp/reference/functions/filetypeisother)             | -                                                                                                       |
| [toTinyFileSystemError](/projects/konkerdev-tiny-filesystem-fp/reference/functions/totinyfilesystemerror) | -                                                                                                       |

## Variables

### NodeTinyFileSystem

```ts
const NodeTinyFileSystem: TinyFileSystemWithGlob<TinyFileSystemAppendable>;
```

#### Source

[src/node/index.ts:170](https://github.com/konkerdotdev/tiny-filesystem-fp/blob/900743fd8cf49d9e7c3831c08b0b3c0dd3e06fb2/src/node/index.ts#L170)

---

### TAG

```ts
const TAG: 'TinyFileSystemError' = 'TinyFileSystemError';
```

#### Source

[src/lib/error.ts:1](https://github.com/konkerdotdev/tiny-filesystem-fp/blob/900743fd8cf49d9e7c3831c08b0b3c0dd3e06fb2/src/lib/error.ts#L1)
