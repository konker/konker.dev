import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { Option, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { DirectoryData } from '../../index.js';
import { TreeCrawlerDataType } from '../../index.js';
import type { TinyTreeCrawlerError } from '../../lib/error.js';
import { toTinyTreeCrawlerError } from '../../lib/error.js';

export const FileListingTreeCrawlerDirectoryHandler = (
  tfs: TinyFileSystem,
  path: string,
  level: number
): Effect.Effect<Option.Option<DirectoryData>, TinyTreeCrawlerError> =>
  pipe(
    tfs.listFiles(path),
    Effect.mapError(toTinyTreeCrawlerError),
    Effect.map((files) => Option.some({ _tag: TreeCrawlerDataType.Directory, level, path, data: files }))
  );
