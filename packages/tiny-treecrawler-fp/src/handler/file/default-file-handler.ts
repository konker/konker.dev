import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { Option, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { FileData } from '../../index.js';
import { TreeCrawlerDataType } from '../../index.js';
import type { TinyTreeCrawlerError } from '../../lib/error.js';
import { toTinyTreeCrawlerError } from '../../lib/error.js';

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
