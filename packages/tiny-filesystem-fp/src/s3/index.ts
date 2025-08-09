import { Buffer } from 'node:buffer';
import type readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';

import type { S3Client } from '@aws-sdk/client-s3';
import { S3 } from '@effect-aws/client-s3';
import { S3ClientInstance } from '@effect-aws/client-s3/S3ClientInstance';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import path from 'path';

import type { Path, Ref, TinyFileSystem } from '../index.js';
import { FileType } from '../index.js';
import type { TinyFileSystemError } from '../lib/error.js';
import { toTinyFileSystemError } from '../lib/error.js';
import { readlineInterfaceFromReadStream, readStreamToBuffer } from '../lib/stream.js';
import type { S3IoUrl, S3UrlData } from './s3-uri-utils.js';
import * as s3Utils from './s3-uri-utils.js';
import { s3UrlDataIsDirectory, s3UrlDataIsFile } from './s3-uri-utils.js';
import { s3ObjectIsReadable, UploadObjectEffect, UploadObjectWriteStreamEffect } from './utils.js';

const getFileReadStream =
  (s3Client: S3Client) =>
  (filePath: string): Effect.Effect<Readable, TinyFileSystemError> => {
    return pipe(
      s3Utils.parseS3Url(filePath),
      Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot read a file with a non-file url')
      ),
      Effect.flatMap((parsed) =>
        S3.getObject({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      Effect.filterOrFail(s3ObjectIsReadable, () =>
        toTinyFileSystemError('[S3TinyFileSystem] getFileReadStream: Body is not a Readable')
      ),
      Effect.map((s3File) => s3File.Body as Readable),
      Effect.mapError(toTinyFileSystemError),
      Effect.provide(S3.baseLayer(() => s3Client))
    );
  };

const getFileLineReadStream =
  (s3Client: S3Client) =>
  (filePath: string): Effect.Effect<readline.Interface, TinyFileSystemError> => {
    return pipe(
      filePath,
      getFileReadStream(s3Client),
      Effect.flatMap(readlineInterfaceFromReadStream),
      Effect.mapError(toTinyFileSystemError)
    );
  };

const getFileWriteStream =
  (s3Client: S3Client) =>
  (filePath: string): Effect.Effect<Writable, TinyFileSystemError> => {
    return pipe(
      s3Utils.parseS3Url(filePath),
      Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot write to a file with a non-file url')
      ),
      Effect.flatMap((parsed) =>
        UploadObjectWriteStreamEffect(s3Client, {
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      Effect.mapError(toTinyFileSystemError),
      Effect.provide(S3.baseLayer(() => s3Client))
    );
  };

const listFiles =
  (s3Client: S3Client) =>
  (dirPath: string): Effect.Effect<Array<S3IoUrl>, TinyFileSystemError> => {
    function _processListing(parsed: S3UrlData, list: Array<any> | undefined, key: string): Array<S3IoUrl> {
      if (!list) return [];
      return (
        list
          // Drop any bad keys
          .filter((item: Record<string, string>) => item[key])
          .map(
            // Extract the last part of the path relative to the prefix
            // eslint-disable-next-line fp/no-mutating-methods
            (item: Record<string, string>) => relative(parsed.Path, item[key]!).split(path.posix.sep).shift()!
          )
          .filter((item) => item !== '')
          .map(
            // Convert each item to full S3 url
            (item: string) => s3Utils.createS3Url(parsed.Bucket, parsed.Path, item)
          )
      );
    }

    return pipe(
      s3Utils.parseS3Url(dirPath),
      Effect.filterOrFail(s3UrlDataIsDirectory, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot list files with a non-directory url')
      ),
      Effect.flatMap((parsed) =>
        pipe(
          S3.listObjectsV2({
            Bucket: parsed.Bucket,
            Delimiter: '/',
            Prefix: parsed.Path,
          }),
          Effect.flatMap((allFiles) =>
            Effect.tryPromise({
              try: async () => {
                if (allFiles.IsTruncated) {
                  // eslint-disable-next-line fp/no-throw
                  throw new Error(`[S3TinyFileSystem] Error: listing is truncated: ${dirPath}`);
                }

                return _processListing(parsed, allFiles.CommonPrefixes, 'Prefix').concat(
                  _processListing(parsed, allFiles.Contents, 'Key')
                );
              },
              catch: toTinyFileSystemError,
            })
          ),
          Effect.mapError(toTinyFileSystemError),
          Effect.provide(S3.baseLayer(() => s3Client))
        )
      )
    );
  };

const exists =
  (s3Client: S3Client) =>
  (fileOrDirPath: string): Effect.Effect<boolean, TinyFileSystemError> => {
    return pipe(
      s3Utils.parseS3Url(fileOrDirPath),
      Effect.flatMap((parsed: S3UrlData) =>
        S3.headObject({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      Effect.map((_) => true),
      Effect.catchTag('NotFound', () => Effect.succeed(false)),
      Effect.mapError(toTinyFileSystemError),
      Effect.provide(S3.baseLayer(() => s3Client))
    );
  };

const getFileType =
  (_s3Client: S3Client) =>
  (filePath: string): Effect.Effect<FileType, TinyFileSystemError> => {
    return pipe(
      s3Utils.parseS3Url(filePath),
      Effect.map((parsed) => parsed.Type)
    );
  };

const readFile =
  (s3Client: S3Client) =>
  (s3url: string): Effect.Effect<Uint8Array, TinyFileSystemError> => {
    return pipe(
      s3Utils.parseS3Url(s3url),
      Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot read a file with a directory url')
      ),
      Effect.flatMap((parsed) =>
        S3.getObject({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      Effect.filterOrFail(s3ObjectIsReadable, (resp) =>
        toTinyFileSystemError(
          `[S3TinyFileSystem] S3 object does not have a readable stream Body: ${JSON.stringify(resp)}`
        )
      ),
      Effect.flatMap((resp) => readStreamToBuffer(resp.Body as Readable)),
      Effect.map((buffer) => new Uint8Array(buffer)),
      Effect.mapError(toTinyFileSystemError),
      Effect.provide(S3.baseLayer(() => s3Client))
    );
  };

const writeFile =
  (s3Client: S3Client) =>
  (s3url: string, data: ArrayBuffer | Uint8Array | string): Effect.Effect<void, TinyFileSystemError> => {
    return pipe(
      s3Utils.parseS3Url(s3url),
      Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot write a file with a directory url')
      ),
      Effect.flatMap((parsed) =>
        UploadObjectEffect(
          s3Client,
          {
            Bucket: parsed.Bucket,
            Key: parsed.FullPath,
          },
          data instanceof ArrayBuffer ? Buffer.from(new Uint8Array(data)) : Buffer.from(data)
        )
      ),
      Effect.mapError(toTinyFileSystemError)
    );
  };

const deleteFile =
  (s3Client: S3Client) =>
  (filePath: string): Effect.Effect<void, TinyFileSystemError> => {
    return pipe(
      s3Utils.parseS3Url(filePath),
      Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot delete a file with a directory url')
      ),
      Effect.flatMap((parsed) =>
        S3.deleteObject({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      Effect.mapError(toTinyFileSystemError),
      Effect.provide(S3.baseLayer(() => s3Client))
    );
  };

const createDirectory =
  (s3Client: S3Client) =>
  (dirPath: string): Effect.Effect<void, TinyFileSystemError> => {
    return pipe(
      s3Utils.parseS3Url(dirPath),
      Effect.filterOrFail(s3UrlDataIsDirectory, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot create a directory with a non-directory url')
      ),
      Effect.flatMap((parsed) =>
        S3.putObject({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
          ContentLength: 0,
        })
      ),
      Effect.mapError(toTinyFileSystemError),
      Effect.provide(S3.baseLayer(() => s3Client))
    );
  };

const removeDirectory =
  (s3Client: S3Client) =>
  (dirPath: string): Effect.Effect<void, TinyFileSystemError> => {
    function _purgeItem(s3ItemUrl: S3IoUrl): Effect.Effect<void, TinyFileSystemError> {
      return pipe(
        s3ItemUrl,
        getFileType(s3Client),
        Effect.flatMap((fileType) =>
          fileType === FileType.Directory ? removeDirectory(s3Client)(s3ItemUrl) : deleteFile(s3Client)(s3ItemUrl)
        )
      );
    }

    return pipe(
      // Remove contents of the directory
      dirPath,
      listFiles(s3Client),
      Effect.map((dirContent) => dirContent.map((i) => _purgeItem(i))),
      Effect.flatMap(Effect.all),

      // Remove the directory itself.
      // No need to check if is a Directory url, as listFiles will have already failed
      Effect.flatMap((_void) =>
        pipe(
          s3Utils.parseS3Url(dirPath),
          Effect.flatMap((parsed) =>
            S3.deleteObject({
              Bucket: parsed.Bucket,
              Key: parsed.FullPath,
            })
          )
        )
      ),
      Effect.mapError(toTinyFileSystemError),
      Effect.provide(S3.baseLayer(() => s3Client))
    );
  };

// eslint-disable-next-line fp/no-rest-parameters
function joinPath(...parts: Array<string>): Effect.Effect<Ref, TinyFileSystemError> {
  if (parts[0] === undefined) return Effect.succeed('' as Path);

  return parts[0].startsWith(s3Utils.S3_PROTOCOL)
    ? pipe(
        s3Utils.parseS3Url(parts[0]),
        Effect.map((parsed) => s3Utils.createS3Url(parsed.Bucket, path.posix.join(parsed.FullPath, ...parts.slice(1))))
      )
    : Effect.succeed(path.posix.join(...parts) as Path);
}

function relative(from: string, to: string): Ref {
  return path.posix.relative(from, to) as S3IoUrl;
}

function dirName(filePath: string): Effect.Effect<Ref, TinyFileSystemError> {
  return pipe(
    s3Utils.parseS3Url(filePath),
    Effect.map((parsed) => s3Utils.createS3Url(parsed.Bucket, parsed.Path))
  );
}

function fileName(filePath: string): Effect.Effect<Ref, TinyFileSystemError> {
  return pipe(
    s3Utils.parseS3Url(filePath),
    Effect.flatMap((parsed) => pipe(parsed.File, Effect.fromNullable, Effect.mapError(toTinyFileSystemError)))
  );
}

function basename(fileOrDirPath: string, suffix?: string): Ref {
  return path.posix.basename(fileOrDirPath, suffix) as Ref;
}

function extname(filePath: string): string {
  return path.posix.extname(filePath);
}

function isAbsolute(fileOrDirPath: string): boolean {
  return fileOrDirPath.startsWith(s3Utils.S3_PROTOCOL);
}

export const S3TinyFileSystem = (): Effect.Effect<TinyFileSystem, never, S3ClientInstance> =>
  pipe(
    S3ClientInstance,
    Effect.map((s3Client) => {
      return {
        ID: 'S3TinyFileSystem',

        PATH_SEP: path.posix.sep,

        joinPath,
        relative,
        dirName,
        fileName,
        basename,
        extname,
        isAbsolute,

        getFileReadStream: getFileReadStream(s3Client),
        getFileLineReadStream: getFileLineReadStream(s3Client),
        getFileWriteStream: getFileWriteStream(s3Client),
        readFile: readFile(s3Client),
        writeFile: writeFile(s3Client),
        deleteFile: deleteFile(s3Client),
        createDirectory: createDirectory(s3Client),
        removeDirectory: removeDirectory(s3Client),
        listFiles: listFiles(s3Client),
        exists: exists(s3Client),
        getFileType: getFileType(s3Client),
      };
    })
  );

export type S3TinyFileSystem = ReturnType<typeof S3TinyFileSystem>;
