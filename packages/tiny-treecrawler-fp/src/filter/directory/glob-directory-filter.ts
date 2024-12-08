import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { toTinyFileSystemError } from '@konker.dev/tiny-filesystem-fp/dist/lib/error';
import micromatch from 'micromatch';

import { toTinyTreeCrawlerError } from '../../lib/error';
import type { TreeCrawlerDirectoryFilter } from '../index';

export const GlobDirectoryFilter =
  (globPattern: string): TreeCrawlerDirectoryFilter =>
  (tfs: TinyFileSystem, rootPath: string, dirPath: string, _dirName: string, _level: number) =>
    P.pipe(
      tfs.joinPath(rootPath, dirPath),
      P.Effect.flatMap((fullPath) =>
        P.Effect.try({ try: () => micromatch([fullPath], [globPattern]), catch: toTinyFileSystemError })
      ),
      P.Effect.mapError(toTinyTreeCrawlerError),
      P.Effect.map((matches) => matches && matches.length > 0)
    );
