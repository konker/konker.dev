import type readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';

import { pipe, Schema } from 'effect';
import type * as Effect from 'effect/Effect';

import type { TinyFileSystemError } from './lib/error.js';

export enum FileType {
  Directory = 'Directory',
  File = 'File',
  Other = 'Other',
}
export type FileTypeS = `${FileType}`;

export const DirectoryPath = pipe(Schema.String, Schema.brand(Symbol.for('DirectoryPath')));
export type DirectoryPath = Schema.Schema.Type<typeof DirectoryPath>;
export const FileName = pipe(Schema.String, Schema.brand(Symbol.for('FileName')));
export type FileName = Schema.Schema.Type<typeof FileName>;
export const IoUrl = pipe(Schema.String, Schema.brand(Symbol.for('IoUrl')));
export type IoUrl = Schema.Schema.Type<typeof IoUrl>;
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

  readonly PATH_SEP: string;

  /**
   * List the files and directories in the given directory path
   *
   * @param dirPath - The full path to the directory to list
   */
  listFiles: (dirPath: string) => Effect.Effect<Array<Ref>, TinyFileSystemError>;

  /**
   * Resolve the type of the given file or directory
   *
   * @param filePath - The full path to the file or directory
   */
  getFileType: (filePath: string) => Effect.Effect<FileType, TinyFileSystemError>;

  /**
   * Check if the given file or directory path exists
   *
   * @param fileOrDirPath - The full path to the file or directory to test
   */
  exists: (fileOrDirPath: string) => Effect.Effect<boolean, TinyFileSystemError>;

  /**
   * Read the content of the given file into a Uint8Array
   *
   * @param filePath - The full path of the file to read
   */
  readFile: (filePath: string) => Effect.Effect<Uint8Array, TinyFileSystemError>;

  /**
   * Write the given data into the given file
   *
   * @param filePath - The full path of the file to write
   * @param data - The data to write
   */
  writeFile: (filePath: string, data: string | ArrayBuffer | Uint8Array) => Effect.Effect<void, TinyFileSystemError>;

  /**
   * Delete the given file
   *
   * @param filePath - The full path of the file to delete
   */
  deleteFile: (filePath: string) => Effect.Effect<void, TinyFileSystemError>;

  /**
   * Create the given directory
   *
   * Parent directories are created if they do not already exist
   *
   * @param dirPath - The full path of the directory to create
   */
  createDirectory: (dirPath: string) => Effect.Effect<void, TinyFileSystemError>;

  /**
   * Remove the given directory
   *
   * Any existing file and subdirectories will be automatically removed
   *
   * @param dirPath - The full path of the directory to remove
   */
  removeDirectory: (dirPath: string) => Effect.Effect<void, TinyFileSystemError>;

  /**
   * Get a read stream for the given file
   *
   * @param filePath
   */
  getFileReadStream: (filePath: string) => Effect.Effect<Readable, TinyFileSystemError>;

  /**
   * Get a stream which will read the given file line by line
   *
   * @param filePath - THe full path of the file to read
   */
  getFileLineReadStream: (filePath: string) => Effect.Effect<readline.Interface, TinyFileSystemError>;

  /**
   * Get a stream to write to the given file
   *
   * @param filePath - The full path of the file
   */
  getFileWriteStream: (filePath: string) => Effect.Effect<Writable, TinyFileSystemError>;

  /**
   * Get the parent directory path from the given file path
   *
   * @param filePath - The full path of the file
   */
  dirName: (filePath: string) => Effect.Effect<Ref, TinyFileSystemError>;

  /**
   * Extract the file name from a file path
   *
   * @param filePath - The full path of the file
   */
  fileName: (filePath: string) => Effect.Effect<FileName, TinyFileSystemError>;

  /**
   * Extract the last part of a file or directory path
   *
   * @param fileOrDirPath - The full path of the file or directory
   * @param [suffix] - Optional suffix to remove
   */
  basename: (fileOrDirPath: string, suffix?: string) => Ref;

  /**
   * Join the given parts into a full path
   *
   * @param parts - The parts of the path to join
   */
  // eslint-disable-next-line fp/no-rest-parameters
  joinPath: (...parts: Array<string>) => Effect.Effect<Ref, TinyFileSystemError>;

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

  /**
   * Test if the given file or directory path is an absolute path
   *
   * @param fileOrDirPath - The full path of the file or directory
   * */
  isAbsolute: (filePath: string) => boolean;
};

export type TinyFileSystemAppendable<T extends TinyFileSystem = TinyFileSystem> = T & {
  readonly getFileAppendWriteStream: (filePath: string) => Effect.Effect<Writable, TinyFileSystemError>;
};

export type TinyFileSystemWithGlob<T extends TinyFileSystem = TinyFileSystem> = T & {
  readonly glob: (dirPath: string) => Effect.Effect<Array<Ref>, TinyFileSystemError>;
};
