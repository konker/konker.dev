import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { toTinyFileSystemError } from '@konker.dev/tiny-filesystem-fp/dist/lib/error';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import micromatch from 'micromatch';

import { toTinyTreeCrawlerError } from '../../lib/error';
import type { TreeCrawlerDirectoryFilter } from '../index';

export const GlobDirectoryFilter =
  (globPattern: string): TreeCrawlerDirectoryFilter =>
  (tfs: TinyFileSystem, rootPath: string, dirPath: string, _dirName: string, _level: number) =>
    pipe(
      tfs.joinPath(rootPath, dirPath),
      Effect.flatMap((fullPath) =>
        Effect.try({ try: () => micromatch([fullPath], [globPattern]), catch: toTinyFileSystemError })
      ),
      Effect.mapError(toTinyTreeCrawlerError),
      Effect.map((matches) => matches && matches.length > 0)
    );
