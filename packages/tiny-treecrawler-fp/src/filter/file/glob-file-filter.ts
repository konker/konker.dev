import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { toTinyFileSystemError } from '@konker.dev/tiny-filesystem-fp/dist/lib/error';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import micromatch from 'micromatch';

import { toTinyTreeCrawlerError } from '../../lib/error';
import type { TreeCrawlerFileFilter } from '../index';

export const GlobFileFilter =
  (globPattern: string): TreeCrawlerFileFilter =>
  (tfs: TinyFileSystem, rootPath: string, dirPath: string, fileName: string, _level: number) =>
    pipe(
      tfs.joinPath(rootPath, dirPath, fileName),
      Effect.flatMap((fullPath) =>
        Effect.try({ try: () => micromatch([fullPath], [globPattern]), catch: toTinyFileSystemError })
      ),
      Effect.mapError(toTinyTreeCrawlerError),
      Effect.map((matches) => matches && matches.length > 0)
    );
