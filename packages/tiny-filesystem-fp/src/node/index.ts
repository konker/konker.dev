import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';

import * as P from '@konker.dev/effect-ts-prelude';
import * as fg from 'fast-glob';

import type { DirectoryPath, FileName, Path, Ref, TinyFileSystemAppendable, TinyFileSystemWithGlob } from '../index';
import { FileType, fileTypeIsFile } from '../index';
import type { TinyFileSystemError } from '../lib/error';
import { toTinyFileSystemError } from '../lib/error';

function getFileReadStream(filePath: string): P.Effect.Effect<Readable, TinyFileSystemError> {
  return P.Effect.tryPromise({ try: async () => fs.createReadStream(filePath), catch: toTinyFileSystemError });
}

function getFileLineReadStream(filePath: string): P.Effect.Effect<readline.Interface, TinyFileSystemError> {
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

function getFileWriteStream(filePath: string): P.Effect.Effect<Writable, TinyFileSystemError> {
  return P.Effect.tryPromise({
    try: async () => fs.createWriteStream(filePath, { flags: 'w' }),
    catch: toTinyFileSystemError,
  });
}

function getFileAppendWriteStream(filePath: string): P.Effect.Effect<Writable, TinyFileSystemError> {
  return P.Effect.tryPromise({
    try: async () => fs.createWriteStream(filePath, { flags: 'a' }),
    catch: toTinyFileSystemError,
  });
}

function listFiles(dirPath: string): P.Effect.Effect<Array<Ref>, TinyFileSystemError> {
  return P.Effect.tryPromise({
    try: async () => {
      const files = await fs.promises.readdir(dirPath);
      return files.map((file) => path.join(dirPath, file) as Path);
    },
    catch: toTinyFileSystemError,
  });
}

function glob(globPattern: string): P.Effect.Effect<Array<Ref>, TinyFileSystemError> {
  return P.Effect.tryPromise({
    try: async () => {
      const files = await fg.async(globPattern, { fs });
      return files.map((file) => String(file) as Path);
    },
    catch: toTinyFileSystemError,
  });
}

function exists(fileOrDirPath: string): P.Effect.Effect<boolean, TinyFileSystemError> {
  return P.Effect.tryPromise({ try: async () => fs.existsSync(fileOrDirPath), catch: toTinyFileSystemError });
}

function getFileType(filePath: string): P.Effect.Effect<FileType, TinyFileSystemError> {
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

function createDirectory(dirPath: string): P.Effect.Effect<void, TinyFileSystemError> {
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

function removeDirectory(dirPath: string): P.Effect.Effect<void, TinyFileSystemError> {
  return P.Effect.tryPromise({
    try: async () => {
      if (fs.existsSync(dirPath)) {
        // eslint-disable-next-line fp/no-unused-expression
        await fs.promises.rm(dirPath, { recursive: true });
      }
      return P.Effect.void;
    },
    catch: toTinyFileSystemError,
  });
}

function readFile(filePath: string): P.Effect.Effect<Uint8Array, TinyFileSystemError> {
  return P.Effect.tryPromise({
    try: async () => new Uint8Array(Buffer.from(await fs.promises.readFile(filePath))),
    catch: toTinyFileSystemError,
  });
}

function writeFile(filePath: string, data: ArrayBuffer | string): P.Effect.Effect<void, TinyFileSystemError> {
  return P.Effect.tryPromise({
    try: async () => fs.promises.writeFile(filePath, typeof data === 'string' ? Buffer.from(data) : Buffer.from(data)),
    catch: toTinyFileSystemError,
  });
}

function deleteFile(filePath: string): P.Effect.Effect<void, TinyFileSystemError> {
  return P.Effect.tryPromise({ try: async () => fs.promises.unlink(filePath), catch: toTinyFileSystemError });
}

// eslint-disable-next-line fp/no-rest-parameters
function joinPath(...parts: Array<string>): P.Effect.Effect<Ref, TinyFileSystemError> {
  return P.Effect.succeed(path.join(...parts) as Ref);
}

function relative(from: string, to: string): Ref {
  return path.relative(from, to) as Ref;
}

function dirName(filePath: string): P.Effect.Effect<Ref, TinyFileSystemError> {
  return P.Effect.succeed(path.dirname(filePath) as DirectoryPath);
}

function fileName(filePath: string): P.Effect.Effect<FileName, TinyFileSystemError> {
  return P.pipe(
    getFileType(filePath),
    P.Effect.flatMap((fileType) =>
      P.pipe(fileTypeIsFile(fileType), (isFile) =>
        isFile
          ? P.Effect.succeed(path.basename(filePath) as FileName)
          : P.Effect.fail(toTinyFileSystemError('Cannot get file name of a directory'))
      )
    )
  );
}

function basename(fileOrDirPath: string, suffix?: string): Ref {
  return path.basename(fileOrDirPath, suffix) as Ref;
}

function extname(filePath: string): string {
  return path.extname(filePath);
}

function isAbsolute(fileOrDirPath: string): boolean {
  return path.isAbsolute(fileOrDirPath);
}

export const NodeTinyFileSystem: TinyFileSystemWithGlob<TinyFileSystemAppendable> = {
  ID: 'NodeTinyFileSystem',

  PATH_SEP: path.sep,

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
  glob,
  exists,
  getFileType,
  joinPath,
  relative,
  dirName,
  fileName,
  basename,
  extname,
  isAbsolute,
};
