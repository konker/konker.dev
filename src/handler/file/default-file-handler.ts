import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { FileData } from '../../index';
import type { TinyTreeCrawlerError } from '../../lib/error';
import { toTinyTreeCrawlerError } from '../../lib/error';

export const DefaultTreeCrawlerFileHandler = (
  tfs: TinyFileSystem,
  dirPath: string,
  fileName: string,
  level: number
): P.Effect.Effect<never, TinyTreeCrawlerError, P.Option.Option<FileData>> =>
  P.pipe(
    P.Effect.Do,
    P.Effect.bind('path', () => tfs.joinPath(dirPath, fileName)),
    P.Effect.bind('data', ({ path }) => tfs.readFile(path)),
    P.Effect.mapError(toTinyTreeCrawlerError),
    P.Effect.map(({ data, path }) =>
      P.Option.some({
        _tag: 'File',
        level,
        path,
        data: [data.toString()],
      })
    )
  );
