import * as P from '@konker.dev/effect-ts-prelude';

import type { Err, FileData } from '../../index';
import type { TinyFileSystem } from '../../lib/TinyFileSystem';

export const DefaultTreeCrawlerFileHandler = (
  tfs: TinyFileSystem,
  dirPath: string,
  fileName: string,
  level: number
): P.Effect.Effect<never, Err, P.Option.Option<FileData>> =>
  P.pipe(
    P.Effect.Do,
    P.Effect.bind('path', () => tfs.joinPath(dirPath, fileName)),
    P.Effect.bind('data', ({ path }) => tfs.readFile(path)),
    P.Effect.map(({ data, path }) =>
      P.Option.some({
        _tag: 'File',
        level,
        path,
        data: [data.toString()],
      })
    )
  );
