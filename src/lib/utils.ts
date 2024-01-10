import * as P from '@konker.dev/effect-ts-prelude';
import type { FileType, Ref, TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { TinyFileSystemError } from './error';

// Array functions
export const Array = {
  map:
    <A, B>(f: (a: A) => B) =>
    (as: Array<A>): Array<B> =>
      as.map(f),
};

export const DIRECTORIES_FIRST = true;
export const FILES_FIRST = false;

export const sortListingByFileType =
  (tfs: TinyFileSystem, directoriesFirst: boolean) =>
  (listing: Array<Ref>): P.Effect.Effect<never, TinyFileSystemError, Array<{ childPath: Ref; fileType: FileType }>> =>
    P.pipe(
      listing.map((childPath: Ref) =>
        P.pipe(
          tfs.getFileType(childPath),
          P.Effect.map((fileType) => ({ fileType, childPath }))
        )
      ),
      P.Effect.all,
      P.Effect.map((listingAndTypes) =>
        // eslint-disable-next-line fp/no-mutating-methods
        [...listingAndTypes].sort((a, b) =>
          directoriesFirst ? a.fileType.localeCompare(b.fileType) : b.fileType.localeCompare(a.fileType)
        )
      )
    );
