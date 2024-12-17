import type { FileType, Ref, TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import type { TinyFileSystemError } from '@konker.dev/tiny-filesystem-fp/lib/error';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { DirectoryData, FileData, TreeCrawlerData } from '../index.js';
import { TreeCrawlerDataType } from '../index.js';

export const DIRECTORIES_FIRST = true;
export const FILES_FIRST = false;

export function isFileData(data: TreeCrawlerData): data is FileData {
  return data._tag === TreeCrawlerDataType.File;
}

export function isDirectoryData(data: TreeCrawlerData): data is DirectoryData {
  return data._tag === TreeCrawlerDataType.Directory;
}

export const sortListingByFileType =
  (tfs: TinyFileSystem, directoriesFirst: boolean) =>
  (listing: Array<Ref>): Effect.Effect<Array<{ childPath: Ref; fileType: FileType }>, TinyFileSystemError> =>
    pipe(
      listing.map((childPath: Ref) =>
        pipe(
          tfs.getFileType(childPath),
          Effect.map((fileType) => ({ fileType, childPath }))
        )
      ),
      Effect.all,
      Effect.map((listingAndTypes) =>
        // eslint-disable-next-line fp/no-mutating-methods
        [...listingAndTypes].sort((a, b) =>
          directoriesFirst ? a.fileType.localeCompare(b.fileType) : b.fileType.localeCompare(a.fileType)
        )
      )
    );
