import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { toTinyFileSystemError } from '@konker.dev/tiny-filesystem-fp';
import micromatch from 'micromatch';

import { toTinyTreeCrawlerError } from '../../lib/error';
import type { TreeCrawlerFileFilter } from '../index';

export const GlobFileFilter =
  (globPattern: string): TreeCrawlerFileFilter =>
  (tfs: TinyFileSystem, rootPath: string, dirPath: string, fileName: string, _level: number) =>
    P.pipe(
      tfs.joinPath(rootPath, dirPath, fileName),
      P.Effect.flatMap((fullPath) =>
        P.Effect.try({ try: () => micromatch([fullPath], [globPattern]), catch: toTinyFileSystemError })
      ),
      P.Effect.mapError(toTinyTreeCrawlerError),
      P.Effect.map((matches) => matches && matches.length > 0)
    );
