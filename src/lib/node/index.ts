import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';

import * as P from '@konker.dev/effect-ts-prelude';

import type { TinyFileSystemError } from '../error';
import { toTinyFileSystemError } from '../error';
import type { DirectoryPath, FileName, Path, Ref, TinyFileSystemAppendable } from '../TinyFileSystem';
import { FileType, fileTypeIsFile } from '../TinyFileSystem';

function getFileReadStream(filePath: string): P.Effect.Effect<never, TinyFileSystemError, Readable> {
  return P.Effect.tryPromise({ try: async () => fs.createReadStream(filePath), catch: toTinyFileSystemError });
}

function getFileLineReadStream(filePath: string): P.Effect.Effect<never, TinyFileSystemError, readline.Interface> {
  return P.pipe(
    getFileReadStream(filePath),
    P.Effect.flatMap((readStream) =>
      P.Effect.tryPromise({
        try: async () =>
          readline.createInterface({
            input: readStream,
            historySize: 0,
            terminal: false,
            crlfDelay: Infinity,
            escapeCodeTimeout: 10000,
          }),
        catch: toTinyFileSystemError,
      })
    )
  );
}

function getFileWriteStream(filePath: string): P.Effect.Effect<never, TinyFileSystemError, Writable> {
  return P.Effect.tryPromise({
    try: async () => fs.createWriteStream(filePath, { flags: 'w' }),
    catch: toTinyFileSystemError,
  });
}

function getFileAppendWriteStream(filePath: string): P.Effect.Effect<never, TinyFileSystemError, Writable> {
  return P.Effect.tryPromise({
    try: async () => fs.createWriteStream(filePath, { flags: 'a' }),
    catch: toTinyFileSystemError,
  });
}

function listFiles(dirPath: string): P.Effect.Effect<never, TinyFileSystemError, Array<Ref>> {
  return P.Effect.tryPromise({
    try: async () => {
      const files = await fs.promises.readdir(dirPath);
      return files.map((file) => path.join(dirPath, file) as Path);
    },
    catch: toTinyFileSystemError,
  });
}

function exists(fileOrDirPath: string): P.Effect.Effect<never, TinyFileSystemError, boolean> {
  return P.Effect.tryPromise({ try: async () => fs.existsSync(fileOrDirPath), catch: toTinyFileSystemError });
}

function getFileType(filePath: string): P.Effect.Effect<never, TinyFileSystemError, FileType> {
  return P.Effect.tryPromise({
    try: async () => {
      const stat = await fs.promises.lstat(filePath);
      if (stat.isFile()) return FileType.File;
      if (stat.isDirectory()) return FileType.Directory;
      return FileType.Other;
    },
    catch: toTinyFileSystemError,
  });
}

function createDirectory(dirPath: string): P.Effect.Effect<never, TinyFileSystemError, void> {
  return P.Effect.tryPromise({
    // eslint-disable-next-line fp/no-nil
    try: async () => {
      if (!fs.existsSync(dirPath)) {
        // eslint-disable-next-line fp/no-unused-expression
        await fs.promises.mkdir(dirPath, { recursive: true });
      }
    },
    catch: toTinyFileSystemError,
  });
}

function removeDirectory(dirPath: string): P.Effect.Effect<never, TinyFileSystemError, void> {
  return P.Effect.tryPromise({
    try: async () => {
      if (fs.existsSync(dirPath)) {
        // eslint-disable-next-line fp/no-unused-expression
        await fs.promises.rm(dirPath, { recursive: true });
      }
      return P.Effect.unit;
    },
    catch: toTinyFileSystemError,
  });
}

function readFile(filePath: string): P.Effect.Effect<never, TinyFileSystemError, Buffer> {
  return P.Effect.tryPromise({ try: async () => fs.promises.readFile(filePath), catch: toTinyFileSystemError });
}

function writeFile(filePath: string, data: Buffer | string): P.Effect.Effect<never, TinyFileSystemError, void> {
  return P.Effect.tryPromise({ try: async () => fs.promises.writeFile(filePath, data), catch: toTinyFileSystemError });
}

function deleteFile(filePath: string): P.Effect.Effect<never, TinyFileSystemError, void> {
  return P.Effect.tryPromise({ try: async () => fs.promises.unlink(filePath), catch: toTinyFileSystemError });
}

// eslint-disable-next-line fp/no-rest-parameters
function joinPath(...parts: Array<string>): P.Effect.Effect<never, TinyFileSystemError, Ref> {
  return P.Effect.succeed(path.join(...parts) as Ref);
}

function relative(from: string, to: string): Ref {
  return path.relative(from, to) as Ref;
}

function dirName(filePath: string): P.Effect.Effect<never, TinyFileSystemError, Ref> {
  return P.pipe(
    getFileType(filePath),
    P.Effect.map((_) => path.dirname(filePath) as DirectoryPath)
  );
}

function fileName(filePath: string): P.Effect.Effect<never, TinyFileSystemError, FileName> {
  return P.pipe(
    getFileType(filePath),
    P.Effect.flatMap((fileType) =>
      P.pipe(
        fileTypeIsFile(fileType),
        (isFile) =>
          isFile
            ? P.Effect.succeed(path.basename(filePath) as FileName)
            : P.Effect.fail(toTinyFileSystemError('ERROR MESSAGE'))
        // FIXME: error message
      )
    )
  );
}

function extname(filePath: string): string {
  return path.extname(filePath);
}

export const NodeTinyFileSystem: TinyFileSystemAppendable = {
  ID: 'NodeTinyFileSystem',

  getFileReadStream,
  getFileLineReadStream,
  getFileWriteStream,
  getFileAppendWriteStream,
  createDirectory,
  removeDirectory,
  readFile,
  writeFile,
  deleteFile,
  listFiles,
  exists,
  getFileType,
  joinPath,
  relative,
  dirName,
  fileName,
  extname,
};
