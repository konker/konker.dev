import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';

import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import * as fg from 'fast-glob';

import type { DirectoryPath, FileName, Path, Ref, TinyFileSystemAppendable, TinyFileSystemWithGlob } from '../index.js';
import { FileType, fileTypeIsFile } from '../index.js';
import type { TinyFileSystemError } from '../lib/error.js';
import { toTinyFileSystemError } from '../lib/error.js';

function getFileReadStream(filePath: string): Effect.Effect<Readable, TinyFileSystemError> {
  return Effect.tryPromise({ try: async () => fs.createReadStream(filePath), catch: toTinyFileSystemError });
}

function getFileLineReadStream(filePath: string): Effect.Effect<readline.Interface, TinyFileSystemError> {
  return pipe(
    getFileReadStream(filePath),
    Effect.flatMap((readStream) =>
      Effect.tryPromise({
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

function getFileWriteStream(filePath: string): Effect.Effect<Writable, TinyFileSystemError> {
  return Effect.tryPromise({
    try: async () => fs.createWriteStream(filePath, { flags: 'w' }),
    catch: toTinyFileSystemError,
  });
}

function getFileAppendWriteStream(filePath: string): Effect.Effect<Writable, TinyFileSystemError> {
  return Effect.tryPromise({
    try: async () => fs.createWriteStream(filePath, { flags: 'a' }),
    catch: toTinyFileSystemError,
  });
}

function listFiles(dirPath: string): Effect.Effect<Array<Ref>, TinyFileSystemError> {
  return Effect.tryPromise({
    try: async () => {
      const files = await fs.promises.readdir(dirPath);
      return files.map((file) => path.join(dirPath, file) as Path);
    },
    catch: toTinyFileSystemError,
  });
}

function glob(globPattern: string): Effect.Effect<Array<Ref>, TinyFileSystemError> {
  return Effect.tryPromise({
    try: async () => {
      const files = await fg.async(globPattern, { fs });
      return files.map((file) => String(file) as Path);
    },
    catch: toTinyFileSystemError,
  });
}

function exists(fileOrDirPath: string): Effect.Effect<boolean, TinyFileSystemError> {
  return Effect.tryPromise({ try: async () => fs.existsSync(fileOrDirPath), catch: toTinyFileSystemError });
}

function getFileType(filePath: string): Effect.Effect<FileType, TinyFileSystemError> {
  return Effect.tryPromise({
    try: async () => {
      const stat = await fs.promises.lstat(filePath);
      if (stat.isFile()) return FileType.File;
      if (stat.isDirectory()) return FileType.Directory;
      return FileType.Other;
    },
    catch: toTinyFileSystemError,
  });
}

function createDirectory(dirPath: string): Effect.Effect<void, TinyFileSystemError> {
  return Effect.tryPromise({
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

function removeDirectory(dirPath: string): Effect.Effect<void, TinyFileSystemError> {
  return Effect.tryPromise({
    try: async () => {
      if (fs.existsSync(dirPath)) {
        // eslint-disable-next-line fp/no-unused-expression
        await fs.promises.rm(dirPath, { recursive: true });
      }
      return Effect.void;
    },
    catch: toTinyFileSystemError,
  });
}

function readFile(filePath: string): Effect.Effect<Uint8Array, TinyFileSystemError> {
  return Effect.tryPromise({
    try: async () => new Uint8Array(Buffer.from(await fs.promises.readFile(filePath))),
    catch: toTinyFileSystemError,
  });
}

function writeFile(
  filePath: string,
  data: ArrayBuffer | Uint8Array | string
): Effect.Effect<void, TinyFileSystemError> {
  return Effect.tryPromise({
    try: async () =>
      fs.promises.writeFile(
        filePath,
        typeof data === 'string' ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : Buffer.from(data)
      ),
    catch: toTinyFileSystemError,
  });
}

function deleteFile(filePath: string): Effect.Effect<void, TinyFileSystemError> {
  return Effect.tryPromise({ try: async () => fs.promises.unlink(filePath), catch: toTinyFileSystemError });
}

// eslint-disable-next-line fp/no-rest-parameters
function joinPath(...parts: Array<string>): Effect.Effect<Ref, TinyFileSystemError> {
  return Effect.succeed(path.join(...parts) as Ref);
}

function relative(from: string, to: string): Ref {
  return path.relative(from, to) as Ref;
}

function dirName(filePath: string): Effect.Effect<Ref, TinyFileSystemError> {
  return Effect.succeed(path.dirname(filePath) as DirectoryPath);
}

function fileName(filePath: string): Effect.Effect<FileName, TinyFileSystemError> {
  return pipe(
    getFileType(filePath),
    Effect.flatMap((fileType) =>
      pipe(fileTypeIsFile(fileType), (isFile) =>
        isFile
          ? Effect.succeed(path.basename(filePath) as FileName)
          : Effect.fail(toTinyFileSystemError('Cannot get file name of a directory'))
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
