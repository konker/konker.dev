---
title: 'TinyFileSystem'
author: 'Konrad Markus'
description: 'FIXME-DESC'
order: 2
kind: reference
---

# TinyFileSystem

```ts
type TinyFileSystem: object;
```

## Type declaration

### ID

```ts
readonly ID: string;
```

### PATH_SEP

```ts
readonly PATH_SEP: string;
```

### basename()

```ts
basename: (fileOrDirPath, suffix?) => Ref;
```

Extract the last part of a file or directory path

#### Parameters

• **fileOrDirPath**: `string`

The full path of the file or directory

• **suffix?**: `string`

Optional suffix to remove

#### Returns

[`Ref`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/ref)

### createDirectory()

```ts
createDirectory: (dirPath) => P.Effect.Effect<void, TinyFileSystemError>;
```

Create the given directory

Parent directories are created if they do not already exist

#### Parameters

• **dirPath**: `string`

The full path of the directory to create

#### Returns

`P.Effect.Effect`\<`void`, [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### deleteFile()

```ts
deleteFile: (filePath) => P.Effect.Effect<void, TinyFileSystemError>;
```

Delete the given file

#### Parameters

• **filePath**: `string`

The full path of the file to delete

#### Returns

`P.Effect.Effect`\<`void`, [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### dirName()

```ts
dirName: (filePath) => P.Effect.Effect<Ref, TinyFileSystemError>;
```

Get the parent directory path from the given file path

#### Parameters

• **filePath**: `string`

The full path of the file

#### Returns

`P.Effect.Effect`\<[`Ref`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/ref), [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### exists()

```ts
exists: (fileOrDirPath) => P.Effect.Effect<boolean, TinyFileSystemError>;
```

Check if the given file or directory path exists

#### Parameters

• **fileOrDirPath**: `string`

The full path to the file or directory to test

#### Returns

`P.Effect.Effect`\<`boolean`, [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### extname()

```ts
extname: (filePath) => string;
```

Extract the file name extension from the given file path

E.g. 'foo.csv' -> '.csv'

#### Parameters

• **filePath**: `string`

The full path of the file

#### Returns

`string`

### fileName()

```ts
fileName: (filePath) => P.Effect.Effect<FileName, TinyFileSystemError>;
```

Extract the file name from a file path

#### Parameters

• **filePath**: `string`

The full path of the file

#### Returns

`P.Effect.Effect`\<[`FileName`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/filename), [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### getFileLineReadStream()

```ts
getFileLineReadStream: (filePath) => P.Effect.Effect<readline.Interface, TinyFileSystemError>;
```

Get a stream which will read the given file line by line

#### Parameters

• **filePath**: `string`

THe full path of the file to read

#### Returns

`P.Effect.Effect`\<`readline.Interface`, [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### getFileReadStream()

```ts
getFileReadStream: (filePath) => P.Effect.Effect<Readable, TinyFileSystemError>;
```

Get a read stream for the given file

#### Parameters

• **filePath**: `string`

#### Returns

`P.Effect.Effect`\<`Readable`, [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### getFileType()

```ts
getFileType: (filePath) => P.Effect.Effect<FileType, TinyFileSystemError>;
```

Resolve the type of the given file or directory

#### Parameters

• **filePath**: `string`

The full path to the file or directory

#### Returns

`P.Effect.Effect`\<[`FileType`](/projects/konkerdev-tiny-filesystem-fp/reference/enumerations/filetype), [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### getFileWriteStream()

```ts
getFileWriteStream: (filePath) => P.Effect.Effect<Writable, TinyFileSystemError>;
```

Get a stream to write to the given file

#### Parameters

• **filePath**: `string`

The full path of the file

#### Returns

`P.Effect.Effect`\<`Writable`, [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### isAbsolute()

```ts
isAbsolute: (filePath) => boolean;
```

Test if the given file or directory path is an absolute path

#### Parameters

• **filePath**: `string`

#### Returns

`boolean`

### joinPath()

```ts
joinPath: (...parts) => P.Effect.Effect<Ref, TinyFileSystemError>;
```

Join the given parts into a full path

#### Parameters

• ...**parts**: `string`[]

The parts of the path to join

#### Returns

`P.Effect.Effect`\<[`Ref`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/ref), [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### listFiles()

```ts
listFiles: (dirPath) => P.Effect.Effect<Ref[], TinyFileSystemError>;
```

List the files and directories in the given directory path

#### Parameters

• **dirPath**: `string`

The full path to the directory to list

#### Returns

`P.Effect.Effect`\<[`Ref`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/ref)[], [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### readFile()

```ts
readFile: (filePath) => P.Effect.Effect<Uint8Array, TinyFileSystemError>;
```

Read the content of the given file into a Uint8Array

#### Parameters

• **filePath**: `string`

The full path of the file to read

#### Returns

`P.Effect.Effect`\<`Uint8Array`, [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### relative()

```ts
relative: (from, to) => Ref;
```

Get a relative path from one full path to another full path

#### Parameters

• **from**: `string`

A full file or directory path

• **to**: `string`

A full file or directory path

#### Returns

[`Ref`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/ref)

### removeDirectory()

```ts
removeDirectory: (dirPath) => P.Effect.Effect<void, TinyFileSystemError>;
```

Remove the given directory

Any existing file and subdirectories will be automatically removed

#### Parameters

• **dirPath**: `string`

The full path of the directory to remove

#### Returns

`P.Effect.Effect`\<`void`, [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

### writeFile()

```ts
writeFile: (filePath, data) => P.Effect.Effect<void, TinyFileSystemError>;
```

Write the given data into the given file

#### Parameters

• **filePath**: `string`

The full path of the file to write

• **data**: `string` \| `ArrayBuffer`

The data to write

#### Returns

`P.Effect.Effect`\<`void`, [`TinyFileSystemError`](/projects/konkerdev-tiny-filesystem-fp/reference/type-aliases/tinyfilesystemerror)\>

## Source

[src/index.ts:36](https://github.com/konkerdotdev/tiny-filesystem-fp/blob/900743fd8cf49d9e7c3831c08b0b3c0dd3e06fb2/src/index.ts#L36)
