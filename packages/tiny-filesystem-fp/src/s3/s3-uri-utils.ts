import path from 'node:path';
import { URL } from 'node:url';

import { Either, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { DirectoryPath, FileName, IoUrl } from '../index.js';
import { FileType } from '../index.js';
import type { TinyFileSystemError } from '../lib/error.js';
import { toTinyFileSystemError } from '../lib/error.js';

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
 * Escape an S3 Event URL string
 * E.g. 'folder with space/JPEG image+pl%25us.jpeg' -> 'folder+with+space/JPEG+image%2Bpl%25us.jpeg'
 */
export function s3Escape(s: string): string {
  return encodeURIComponent(s).replaceAll('%20', '+').replaceAll('%2F', '/');
}

/**
 * Unescape an S3 Event URL string
 * E.g. 'folder+with+space/JPEG+image%2Bpl%25us.jpeg' -> 'folder with space/JPEG image+pl%25us.jpeg'
 */
export function s3Unescape(s: string): string {
  return s ? decodeURIComponent(s.replaceAll('+', '%20')) : s;
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
  return `${S3_PROTOCOL}//${s3Escape(path.posix.join(bucket, dirPath ?? '/', part ?? ''))}` as S3IoUrl;
}

/**
 * Parse an S3 URL into its constituent parts
 *
 * @param {string} s3url
 */
export function parseS3Url(s3url: string): Effect.Effect<S3UrlData, TinyFileSystemError> {
  return pipe(
    Effect.try(() => new URL(s3url)),
    Effect.filterOrFail(
      (parsed) => parsed.protocol === S3_PROTOCOL,
      () => toTinyFileSystemError(`[s3-uri-utils] Incorrect protocol, expected ${S3_PROTOCOL}: ${s3url}`)
    ),
    Effect.filterOrFail(
      (parsed) => !!parsed.host,
      () => toTinyFileSystemError(`[s3-uri-utils] Could not determine bucket name: ${s3url}`)
    ),
    Effect.filterOrFail(
      (parsed) => parsed.host === parsed.host.toLowerCase(),
      () =>
        toTinyFileSystemError(
          `[s3-uri-utils] S3 URLs must have a lower case bucket component (note that S3 itself is case sensitive): ${s3url}`
        )
    ),
    Effect.flatMap((parsed) => {
      // FIXME: disabled lint
      const host = parsed.host;
      // eslint-disable-next-line fp/no-let
      let pathname = parsed.pathname === '' ? path.posix.sep : parsed.pathname;
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
      const lastPart = parts.pop()!; // even if pathname is an empty string, parts will have one element
      // eslint-disable-next-line fp/no-nil
      const fileComponent = isS3File(lastPart) ? s3Unescape(lastPart) : undefined;
      if (!fileComponent) {
        // eslint-disable-next-line fp/no-mutating-methods,fp/no-unused-expression
        parts.push(lastPart);
      }

      // eslint-disable-next-line fp/no-mutating-methods,fp/no-unused-expression
      if (parts.length > 0 && parts[0] !== SLASH) parts.push(SLASH);
      const pathComponent = s3Unescape(parts.join(path.posix.sep));
      const fullPathComponent = fileComponent ? path.posix.join(pathComponent!, fileComponent) : pathComponent;

      return Effect.succeed({
        Bucket: host,
        Path: pathComponent as DirectoryPath,
        File: fileComponent as FileName,
        Type: fileComponent ? FileType.File : FileType.Directory,
        FullPath: fullPathComponent,
      });
    }),
    Effect.mapError(toTinyFileSystemError)
  );
}

/**
 * Test to detect if the given path is a valid S3 URL
 *
 * @param s3url
 */
export function isS3Url(s3url: string): boolean {
  return pipe(
    Either.try(() => new URL(s3url)),
    Either.match({
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
  return FILE_EXT_RE.exec(part) !== null;
}
