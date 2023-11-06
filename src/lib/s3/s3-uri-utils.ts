import path from 'node:path';
import { URL } from 'node:url';

import type { S3Client } from '@aws-sdk/client-s3';
import * as P from '@konker.dev/effect-ts-prelude';

import type { TinyFileSystemError } from '../error';
import { toTinyFileSystemError } from '../error';
import { GetSignedUrlEffect, S3ClientDeps } from '../s3-client-fp';
import type { DirectoryPath, FileName, IoUrl } from '../TinyFileSystem';
import { FileType } from '../TinyFileSystem';

export type S3IoUrl<S extends string = string> = IoUrl & `s3://${S}`;
export const S3_PROTOCOL = 's3:';
const FILE_EXT_RE = /\.[^.]+$/;
const SLASH = '';

export type S3UrlData = {
  Bucket: string;
  Path: DirectoryPath;
  File?: FileName | undefined;
  Type: FileType;
  FullPath: string;
};
export type S3UrlDataDirectory = S3UrlData & { Type: FileType.Directory };
export type S3UrlDataFile = S3UrlData & { Type: FileType.File };

export function s3UrlDataIsDirectory(parsed: S3UrlData): parsed is S3UrlDataDirectory {
  return parsed.Type === FileType.Directory;
}

export function s3UrlDataIsFile(parsed: S3UrlData): parsed is S3UrlDataFile {
  return parsed.Type === FileType.File;
}

/**
 * Trim a trailing slash, if present
 *
 * @param s
 */
export function trimSlash(s: string): string {
  return s.endsWith(path.posix.sep) ? s.slice(0, -1) : s;
}

/**
 * Create an S3 URL from the given parts
 *
 * @param bucket
 * @param [dirPath]
 * @param [part]
 */
export function createS3Url(bucket: string, dirPath?: string, part?: string): S3IoUrl {
  return `${S3_PROTOCOL}//${path.posix.join(bucket, dirPath || '/', part || '')}` as S3IoUrl;
}

/**
 * Parse an S3 URL into its constituent parts
 *
 * @param {string} s3url
 */
export function parseS3Url(s3url: string): P.Effect.Effect<never, TinyFileSystemError, S3UrlData> {
  return P.pipe(
    P.Effect.try(() => new URL(s3url)),
    P.Effect.filterOrFail(
      (parsed) => parsed.protocol === S3_PROTOCOL,
      () => toTinyFileSystemError(`[s3-uri-utils] Incorrect protocol, expected ${S3_PROTOCOL}: ${s3url}`)
    ),
    P.Effect.filterOrFail(
      (parsed) => !!parsed.host,
      () => toTinyFileSystemError(`[s3-uri-utils] Could not determine bucket name: ${s3url}`)
    ),
    P.Effect.filterOrFail(
      (parsed) => parsed.host === parsed.host.toLowerCase(),
      () =>
        toTinyFileSystemError(
          `[s3-uri-utils] S3 URLs must have a lower case bucket component (note that S3 itself is case sensitive): ${s3url}`
        )
    ),
    P.Effect.flatMap((parsed) => {
      // FIXME: disabled lint
      const host = parsed.host;
      // eslint-disable-next-line fp/no-mutation,fp/no-let
      let pathname = parsed.pathname ?? path.posix.sep;
      if (pathname.endsWith(path.posix.sep)) {
        // eslint-disable-next-line fp/no-mutation
        pathname = pathname.slice(0, -1);
      }
      if (pathname.startsWith(path.posix.sep)) {
        // eslint-disable-next-line fp/no-mutation
        pathname = pathname.slice(1);
      }

      const parts = pathname.split(path.posix.sep);
      // eslint-disable-next-line fp/no-mutating-methods
      const lastPart = parts.pop() ?? '';
      // eslint-disable-next-line fp/no-nil
      const fileComponent = isS3File(lastPart) ? lastPart : undefined;
      if (!fileComponent) {
        // eslint-disable-next-line fp/no-mutating-methods,fp/no-unused-expression
        parts.push(lastPart);
      }

      // eslint-disable-next-line fp/no-mutating-methods,fp/no-unused-expression
      if (parts.length > 0 && parts[0] !== SLASH) parts.push(SLASH);
      const pathComponent = parts.join(path.posix.sep);
      const fullPathComponent = fileComponent ? path.posix.join(pathComponent, fileComponent) : pathComponent;

      return P.Effect.succeed({
        Bucket: host,
        Path: pathComponent as DirectoryPath,
        File: fileComponent as FileName,
        Type: fileComponent ? FileType.File : FileType.Directory,
        FullPath: fullPathComponent,
      });
    }),
    P.Effect.mapError(toTinyFileSystemError)
  );
}

/**
 * Test to detect if the given path is a valid S3 URL
 *
 * @param s3url
 */
export function isS3Url(s3url: string): boolean {
  return P.pipe(
    P.Either.try(() => new URL(s3url)),
    P.Either.match({
      onLeft: () => false,
      onRight: (parsed) =>
        parsed.protocol === S3_PROTOCOL && !!parsed.host && parsed.host === parsed.host.toLowerCase(),
    })
  );
}

/**
 * Test a string to detect if it is a file path
 *
 * @param part
 */
export function isS3File(part: string): boolean {
  return part.match(FILE_EXT_RE) !== null;
}

/**
 * Get a temporary signed access URL for the given S3 resource
 *
 * @param {S3Client} s3Client
 * @param {S3IoUrl} s3url
 */
export function createHttpsUrl(
  s3Client: S3Client,
  s3url: S3IoUrl
): P.Effect.Effect<never, TinyFileSystemError, string> {
  return P.pipe(
    parseS3Url(s3url),
    P.Effect.flatMap((parsed) => GetSignedUrlEffect({ Bucket: parsed.Bucket, Key: parsed.FullPath })),
    P.Effect.map((resp) => resp.result),
    P.Effect.mapError(toTinyFileSystemError),
    P.Effect.provideService(S3ClientDeps, S3ClientDeps.of({ s3Client }))
  );
}
