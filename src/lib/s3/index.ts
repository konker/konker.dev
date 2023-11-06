import type readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';

import type { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import * as P from '@konker.dev/effect-ts-prelude';
import path from 'path';

import type { TinyFileSystemError } from '../error';
import { toTinyFileSystemError } from '../error';
import {
  DeleteObjectCommandEffect,
  GetObjectCommandEffect,
  HeadObjectCommandEffect,
  ListObjectsV2CommandEffect,
  PutObjectCommandEffect,
  S3ClientDeps,
  S3FactoryDeps,
  s3ObjectIsReadable,
  UploadObjectEffect,
  UploadObjectWriteStreamEffect,
} from '../s3-client-fp';
import { readlineInterfaceFromReadStream, readStreamToBuffer } from '../stream';
import type { Path, Ref, TinyFileSystem } from '../TinyFileSystem';
import { FileType } from '../TinyFileSystem';
import type { S3IoUrl, S3UrlData } from './s3-uri-utils';
import * as s3Utils from './s3-uri-utils';
import { s3UrlDataIsDirectory, s3UrlDataIsFile } from './s3-uri-utils';

function joinPath(parts: string): P.Effect.Effect<never, TinyFileSystemError, Ref> {
  if (!parts[0]) return P.Effect.succeed('' as Path);

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

function dirName(filePath: string): P.Effect.Effect<never, TinyFileSystemError, Ref> {
  return P.pipe(
    s3Utils.parseS3Url(filePath),
    P.Effect.map((parsed) => s3Utils.createS3Url(parsed.Bucket, parsed.Path))
  );
}

function fileName(filePath: string): P.Effect.Effect<never, TinyFileSystemError, Ref> {
  return P.pipe(
    s3Utils.parseS3Url(filePath),
    P.Effect.flatMap((parsed) => P.pipe(parsed.File, P.Effect.fromNullable, P.Effect.mapError(toTinyFileSystemError)))
  );
}

function extname(filePath: string): string {
  return path.posix.extname(filePath);
}

const getFileReadStream =
  (s3Client: S3Client) =>
  (filePath: string): P.Effect.Effect<never, TinyFileSystemError, Readable> => {
    return P.pipe(
      s3Utils.parseS3Url(filePath),
      P.Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot read a file with a non-file url')
      ),
      P.Effect.flatMap((parsed) =>
        GetObjectCommandEffect({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      P.Effect.filterOrFail(s3ObjectIsReadable, () =>
        toTinyFileSystemError('[S3TinyFileSystem] getFileReadStream: Body is not a Readable')
      ),
      P.Effect.map((s3File) => s3File.Body),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const getFileLineReadStream =
  (s3Client: S3Client) =>
  (filePath: string): P.Effect.Effect<never, TinyFileSystemError, readline.Interface> => {
    return P.pipe(
      filePath,
      getFileReadStream(s3Client),
      P.Effect.flatMap(readlineInterfaceFromReadStream),
      P.Effect.mapError(toTinyFileSystemError)
    );
  };

const getFileWriteStream =
  (s3Client: S3Client) =>
  (filePath: string): P.Effect.Effect<never, TinyFileSystemError, Writable> => {
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
  (dirPath: string): P.Effect.Effect<never, TinyFileSystemError, Array<S3IoUrl>> => {
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
          ListObjectsV2CommandEffect({
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
  (fileOrDirPath: string): P.Effect.Effect<never, TinyFileSystemError, boolean> => {
    return P.pipe(
      s3Utils.parseS3Url(fileOrDirPath),
      P.Effect.flatMap((parsed) =>
        HeadObjectCommandEffect({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      P.Effect.map((_) => true),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const getFileType =
  (_s3Client: S3Client) =>
  (filePath: string): P.Effect.Effect<never, TinyFileSystemError, FileType> => {
    return P.pipe(
      s3Utils.parseS3Url(filePath),
      P.Effect.map((parsed) => parsed.Type)
    );
  };

const readFile =
  (s3Client: S3Client) =>
  (s3url: string): P.Effect.Effect<never, TinyFileSystemError, Buffer> => {
    return P.pipe(
      s3Utils.parseS3Url(s3url),
      P.Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot read a file with a directory url')
      ),
      P.Effect.flatMap((parsed) =>
        GetObjectCommandEffect({
          Bucket: parsed.Bucket,
          Key: parsed.FullPath,
        })
      ),
      P.Effect.filterOrFail(s3ObjectIsReadable, () =>
        toTinyFileSystemError('[S3TinyFileSystem] S# object does not have a readable stream Body')
      ),
      P.Effect.flatMap((resp) => readStreamToBuffer(resp.Body)),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const writeFile =
  (s3Client: S3Client) =>
  (s3url: string, data: Buffer | string): P.Effect.Effect<never, TinyFileSystemError, void> => {
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
          data
        )
      ),
      P.Effect.mapError(toTinyFileSystemError),
      P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
    );
  };

const deleteFile =
  (s3Client: S3Client) =>
  (filePath: string): P.Effect.Effect<never, TinyFileSystemError, void> => {
    return P.pipe(
      s3Utils.parseS3Url(filePath),
      P.Effect.filterOrFail(s3UrlDataIsFile, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot delete a file with a directory url')
      ),
      P.Effect.flatMap((parsed) =>
        DeleteObjectCommandEffect({
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
  (dirPath: string): P.Effect.Effect<never, TinyFileSystemError, void> => {
    return P.pipe(
      s3Utils.parseS3Url(dirPath),
      P.Effect.filterOrFail(s3UrlDataIsDirectory, () =>
        toTinyFileSystemError('[S3TinyFileSystem] Cannot create a directory with a non-directory url')
      ),
      P.Effect.flatMap((parsed) =>
        PutObjectCommandEffect({
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
  (dirPath: string): P.Effect.Effect<never, TinyFileSystemError, void> => {
    function _purgeItem(s3ItemUrl: S3IoUrl): P.Effect.Effect<never, TinyFileSystemError, void> {
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
      (x) => x,
      P.Effect.map((dirContent) => dirContent.map((i) => _purgeItem(i))),
      P.Effect.flatMap(P.Effect.all),

      // Remove the directory itself.
      // No need to check if is a Directory url, as listFiles will have already failed
      P.Effect.flatMap((_void) =>
        P.pipe(
          s3Utils.parseS3Url(dirPath),
          P.Effect.flatMap((parsed) =>
            DeleteObjectCommandEffect({
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

export const S3TinyFileSystem = (config: S3ClientConfig): P.Effect.Effect<S3FactoryDeps, never, TinyFileSystem> =>
  P.pipe(
    S3FactoryDeps,
    P.Effect.map((deps) => {
      const s3Client: S3Client = deps.s3ClientFactory(config);

      return {
        ID: 'S3TinyFileSystem',

        joinPath,
        relative,
        dirName,
        fileName,
        extname,

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
