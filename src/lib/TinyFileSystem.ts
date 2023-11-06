import type readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';

import * as P from '@konker.dev/effect-ts-prelude';

import type { TinyFileSystemError } from './error';

export enum FileType {
  Directory = 'Directory',
  File = 'File',
  Other = 'Other',
}
export type FileTypeS = `${FileType}`;

export const DirectoryPath = P.pipe(P.Schema.string, P.Schema.brand(Symbol.for('DirectoryPath')));
export type DirectoryPath = P.Schema.Schema.To<typeof DirectoryPath>;
export const FileName = P.pipe(P.Schema.string, P.Schema.brand(Symbol.for('FileName')));
export type FileName = P.Schema.Schema.To<typeof FileName>;
export const IoUrl = P.pipe(P.Schema.string, P.Schema.brand(Symbol.for('IoUrl')));
export type IoUrl = P.Schema.Schema.To<typeof IoUrl>;
export type Path = DirectoryPath | FileName;
export type Ref = Path | IoUrl;

export function fileTypeIsDirectory(fileType: FileType): fileType is FileType.Directory {
  return fileType === FileType.Directory;
}

export function fileTypeIsFile(fileType: FileType): fileType is FileType.File {
  return fileType === FileType.File;
}

export function fileTypeIsOther(fileType: FileType): fileType is FileType.Other {
  return fileType === FileType.Other;
}

export type TinyFileSystem = {
  readonly ID: string;

  /**
   * List the files and directories in the given directory path
   *
   * @param dirPath - The full path to the directory to list
   */
  listFiles: (dirPath: string) => P.Effect.Effect<never, TinyFileSystemError, Array<Ref>>;

  /**
   * Resolve the type of the given file or directory
   *
   * @param filePath - The full path to the file or directory
   */
  getFileType: (filePath: string) => P.Effect.Effect<never, TinyFileSystemError, FileType>;

  /**
   * Check if the given file or directory path exists
   *
   * @param fileOrDirPath - The full path to the file or directory to test
   */
  exists: (fileOrDirPath: string) => P.Effect.Effect<never, TinyFileSystemError, boolean>;

  /**
   * Read the content of the given file into a Buffer
   *
   * @param filePath - The full path of the file to read
   */
  readFile: (filePath: string) => P.Effect.Effect<never, TinyFileSystemError, Buffer>;

  /**
   * Write the given data into the given file
   *
   * @param filePath - The full path of the file to write
   * @param data - The data to write
   */
  writeFile: (filePath: string, data: string | Buffer) => P.Effect.Effect<never, TinyFileSystemError, void>;

  /**
   * Delete the given file
   *
   * @param filePath - The full path of the file to delete
   */
  deleteFile: (filePath: string) => P.Effect.Effect<never, TinyFileSystemError, void>;

  /**
   * Create the given directory
   *
   * Parent directories are created if they do not already exist
   *
   * @param dirPath - The full path of the directory to create
   */
  createDirectory: (dirPath: string) => P.Effect.Effect<never, TinyFileSystemError, void>;

  /**
   * Remove the given directory
   *
   * Any existing file and subdirectories will be automatically removed
   *
   * @param dirPath - The full path of the directory to remove
   */
  removeDirectory: (dirPath: string) => P.Effect.Effect<never, TinyFileSystemError, void>;

  /**
   * Get a read stream for the given file
   *
   * @param filePath
   */
  getFileReadStream: (filePath: string) => P.Effect.Effect<never, TinyFileSystemError, Readable>;

  /**
   * Get a stream which will read the given file line by line
   *
   * @param filePath - THe full path of the file to read
   */
  getFileLineReadStream: (filePath: string) => P.Effect.Effect<never, TinyFileSystemError, readline.Interface>;

  /**
   * Get a stream to write to the given file
   *
   * @param filePath - The full path of the file
   */
  getFileWriteStream: (filePath: string) => P.Effect.Effect<never, TinyFileSystemError, Writable>;

  /**
   * Get the parent directory path from the given file path
   *
   * @param filePath - The full path of the file
   */
  dirName: (filePath: string) => P.Effect.Effect<never, TinyFileSystemError, Ref>;

  /**
   * Extract the file name from a file path
   *
   * @param filePath - The full path of the file
   */
  fileName: (filePath: string) => P.Effect.Effect<never, TinyFileSystemError, FileName>;

  /**
   * Join the given parts into a full path
   *
   * @param parts - The parts of the path to join
   */
  // eslint-disable-next-line fp/no-rest-parameters
  joinPath: (...parts: Array<string>) => P.Effect.Effect<never, TinyFileSystemError, Ref>;

  /**
   * Get a relative path from one full path to another full path
   *
   * @param from - A full file or directory path
   * @param to - A full file or directory path
   */
  relative: (from: string, to: string) => Ref;

  /**
   * Extract the file name extension from the given file path
   *
   * E.g. 'foo.csv' -> '.csv'
   *
   * @param filePath - The full path of the file
   */
  extname: (filePath: string) => string;
};

export type TinyFileSystemAppendable = TinyFileSystem & {
  readonly getFileAppendWriteStream: (filePath: string) => P.Effect.Effect<never, TinyFileSystemError, Writable>;
};
