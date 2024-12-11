import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { Option, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { FileData } from '../../index';
import { TreeCrawlerDataType } from '../../index';
import type { TinyTreeCrawlerError } from '../../lib/error';
import { toTinyTreeCrawlerError } from '../../lib/error';

export const DefaultTreeCrawlerFileHandler = (
  tfs: TinyFileSystem,
  dirPath: string,
  fileName: string,
  level: number
): Effect.Effect<Option.Option<FileData>, TinyTreeCrawlerError> =>
  pipe(
    Effect.Do,
    Effect.bind('path', () => tfs.joinPath(dirPath, fileName)),
    Effect.bind('data', ({ path }) => tfs.readFile(path)),
    Effect.mapError(toTinyTreeCrawlerError),
    Effect.map(({ data, path }) =>
      Option.some({
        _tag: TreeCrawlerDataType.File,
        level,
        path,
        data,
      })
    )
  );
