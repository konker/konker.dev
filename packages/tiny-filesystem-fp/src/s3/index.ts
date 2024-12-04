import { Buffer } from 'node:buffer';
import type readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';

import type { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import * as S from '@konker.dev/aws-client-effect-s3';
import { S3ClientDeps, S3ClientFactoryDeps } from '@konker.dev/aws-client-effect-s3';
import { UploadObjectEffect, UploadObjectWriteStreamEffect } from '@konker.dev/aws-client-effect-s3/dist/extra';
import * as P from '@konker.dev/effect-ts-prelude';
import path from 'path';

import type { Path, Ref, TinyFileSystem } from '../index';
import { FileType } from '../index';
import type { TinyFileSystemError } from '../lib/error';
import { toTinyFileSystemError } from '../lib/error';
import { readlineInterfaceFromReadStream, readStreamToBuffer } from '../lib/stream';
import type { S3IoUrl, S3UrlData } from './s3-uri-utils';
import * as s3Utils from './s3-uri-utils';
import { s3UrlDataIsDirectory, s3UrlDataIsFile } from './s3-uri-utils';
import { s3ObjectIsReadable } from './utils';

const getFileReadStream =
  (s3Client: S3Client) =>
  (filePath: string): P.Effect.Effect<Readable, TinyFileSystemError> => {
    return P.pipe(
      s3Utils.parseS3Url(filePath),
      P.Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot read a file with a non-file url')
      ),
      P.Effect.flatMap((parsed) =>
        S.GetObjectCommandEffect({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      P.Effect.filterOrFail(s3ObjectIsReadable, () =>
        toTinyFileSystemError('[S3TinyFileSystem] getFileReadStream: Body is not a Readable')
      ),
      P.Effect.map((s3File) => s3File.Body as Readable),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const getFileLineReadStream =
  (s3Client: S3Client) =>
  (filePath: string): P.Effect.Effect<readline.Interface, TinyFileSystemError> => {
    return P.pipe(
      filePath,
      getFileReadStream(s3Client),
      P.Effect.flatMap(readlineInterfaceFromReadStream),
      P.Effect.mapError(toTinyFileSystemError)
    );
  };

const getFileWriteStream =
  (s3Client: S3Client) =>
  (filePath: string): P.Effect.Effect<Writable, TinyFileSystemError> => {
    return P.pipe(
      s3Utils.parseS3Url(filePath),
      P.Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot write to a file with a non-file url')
      ),
      P.Effect.flatMap((parsed) =>
        UploadObjectWriteStreamEffect({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const listFiles =
  (s3Client: S3Client) =>
  (dirPath: string): P.Effect.Effect<Array<S3IoUrl>, TinyFileSystemError> => {
    function _processListing(parsed: S3UrlData, list: Array<any> | undefined, key: string): Array<S3IoUrl> {
      if (!list) return [];
      return (
        list
          // Drop any bad keys
          .filter((item) => item[key])
          .map(
            // Extract the last part of the path relative to the prefix
            // eslint-disable-next-line fp/no-mutating-methods
            (item) => relative(parsed.Path, item[key]).split(path.posix.sep).shift() as string
          )
          .filter((item) => item !== '')
          .map(
            // Convert each item to full S3 url
            (item: string) => s3Utils.createS3Url(parsed.Bucket, parsed.Path, item)
          )
      );
    }

    return P.pipe(
      s3Utils.parseS3Url(dirPath),
      P.Effect.filterOrFail(s3UrlDataIsDirectory, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot list files with a non-directory url')
      ),
      P.Effect.flatMap((parsed) =>
        P.pipe(
          S.ListObjectsV2CommandEffect({
            Bucket: parsed.Bucket,
            Delimiter: '/',
            Prefix: parsed.Path,
          }),
          P.Effect.flatMap((allFiles) =>
            P.Effect.tryPromise({
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
          P.Effect.mapError(toTinyFileSystemError),
          P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
        )
      )
    );
  };

const exists =
  (s3Client: S3Client) =>
  (fileOrDirPath: string): P.Effect.Effect<boolean, TinyFileSystemError> => {
    return P.pipe(
      s3Utils.parseS3Url(fileOrDirPath),
      P.Effect.flatMap((parsed: S3UrlData) =>
        S.HeadObjectCommandEffect({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      P.Effect.map((_) => true),
      P.Effect.catchTag(S.S3_ERROR_TAG, (resp) =>
        (resp as any).cause?.['$metadata']?.httpStatusCode === 404 ? P.Effect.succeed(false) : P.Effect.fail(resp)
      ),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const getFileType =
  (_s3Client: S3Client) =>
  (filePath: string): P.Effect.Effect<FileType, TinyFileSystemError> => {
    return P.pipe(
      s3Utils.parseS3Url(filePath),
      P.Effect.map((parsed) => parsed.Type)
    );
  };

const readFile =
  (s3Client: S3Client) =>
  (s3url: string): P.Effect.Effect<Uint8Array, TinyFileSystemError> => {
    return P.pipe(
      s3Utils.parseS3Url(s3url),
      P.Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot read a file with a directory url')
      ),
      P.Effect.flatMap((parsed) =>
        S.GetObjectCommandEffect({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      P.Effect.filterOrFail(s3ObjectIsReadable, (resp) =>
        toTinyFileSystemError(
          `[S3TinyFileSystem] S3 object does not have a readable stream Body: ${JSON.stringify(resp)}`
        )
      ),
      P.Effect.flatMap((resp) => readStreamToBuffer(resp.Body as Readable)),
      P.Effect.map((buffer) => new Uint8Array(buffer)),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const writeFile =
  (s3Client: S3Client) =>
  (s3url: string, data: ArrayBuffer | string): P.Effect.Effect<void, TinyFileSystemError> => {
    return P.pipe(
      s3Utils.parseS3Url(s3url),
      P.Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot write a file with a directory url')
      ),
      P.Effect.flatMap((parsed) =>
        UploadObjectEffect(
          {
            Bucket: parsed.Bucket,
            Key: parsed.FullPath,
          },
          typeof data === 'string' ? Buffer.from(data) : Buffer.from(data)
        )
      ),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const deleteFile =
  (s3Client: S3Client) =>
  (filePath: string): P.Effect.Effect<void, TinyFileSystemError> => {
    return P.pipe(
      s3Utils.parseS3Url(filePath),
      P.Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot delete a file with a directory url')
      ),
      P.Effect.flatMap((parsed) =>
        S.DeleteObjectCommandEffect({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const createDirectory =
  (s3Client: S3Client) =>
  (dirPath: string): P.Effect.Effect<void, TinyFileSystemError> => {
    return P.pipe(
      s3Utils.parseS3Url(dirPath),
      P.Effect.filterOrFail(s3UrlDataIsDirectory, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot create a directory with a non-directory url')
      ),
      P.Effect.flatMap((parsed) =>
        S.PutObjectCommandEffect({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
          ContentLength: 0,
        })
      ),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const removeDirectory =
  (s3Client: S3Client) =>
  (dirPath: string): P.Effect.Effect<void, TinyFileSystemError> => {
    function _purgeItem(s3ItemUrl: S3IoUrl): P.Effect.Effect<void, TinyFileSystemError> {
      return P.pipe(
        s3ItemUrl,
        getFileType(s3Client),
        P.Effect.flatMap((fileType) =>
          fileType === FileType.Directory ? removeDirectory(s3Client)(s3ItemUrl) : deleteFile(s3Client)(s3ItemUrl)
        )
      );
    }

    return P.pipe(
      // Remove contents of the directory
      dirPath,
      listFiles(s3Client),
      P.Effect.map((dirContent) => dirContent.map((i) => _purgeItem(i))),
      P.Effect.flatMap(P.Effect.all),

      // Remove the directory itself.
      // No need to check if is a Directory url, as listFiles will have already failed
      P.Effect.flatMap((_void) =>
        P.pipe(
          s3Utils.parseS3Url(dirPath),
          P.Effect.flatMap((parsed) =>
            S.DeleteObjectCommandEffect({
              Bucket: parsed.Bucket,
              Key: parsed.FullPath,
            })
          )
        )
      ),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

// eslint-disable-next-line fp/no-rest-parameters
function joinPath(...parts: Array<string>): P.Effect.Effect<Ref, TinyFileSystemError> {
  if (parts[0] === undefined) return P.Effect.succeed('' as Path);

  return parts[0].startsWith(s3Utils.S3_PROTOCOL)
    ? P.pipe(
        s3Utils.parseS3Url(parts[0]),
        P.Effect.map((parsed) =>
          s3Utils.createS3Url(parsed.Bucket, path.posix.join(parsed.FullPath, ...parts.slice(1)))
        )
      )
    : P.Effect.succeed(path.posix.join(...parts) as Path);
}

function relative(from: string, to: string): Ref {
  return path.posix.relative(from, to) as S3IoUrl;
}

function dirName(filePath: string): P.Effect.Effect<Ref, TinyFileSystemError> {
  return P.pipe(
    s3Utils.parseS3Url(filePath),
    P.Effect.map((parsed) => s3Utils.createS3Url(parsed.Bucket, parsed.Path))
  );
}

function fileName(filePath: string): P.Effect.Effect<Ref, TinyFileSystemError> {
  return P.pipe(
    s3Utils.parseS3Url(filePath),
    P.Effect.flatMap((parsed) => P.pipe(parsed.File, P.Effect.fromNullable, P.Effect.mapError(toTinyFileSystemError)))
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

export const S3TinyFileSystem = (config: S3ClientConfig): P.Effect.Effect<TinyFileSystem, never, S3ClientFactoryDeps> =>
  P.pipe(
    S3ClientFactoryDeps,
    P.Effect.map((deps) => {
      const s3Client: S3Client = deps.s3ClientFactory(config);

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
