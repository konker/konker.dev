import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { DirectoryData } from '../../index';
import { TreeCrawlerDataType } from '../../index';
import type { TinyTreeCrawlerError } from '../../lib/error';
import { toTinyTreeCrawlerError } from '../../lib/error';

export const FileListingTreeCrawlerDirectoryHandler = (
  tfs: TinyFileSystem,
  path: string,
  level: number
): P.Effect.Effect<never, TinyTreeCrawlerError, P.Option.Option<DirectoryData>> =>
  P.pipe(
    tfs.listFiles(path),
    P.Effect.mapError(toTinyTreeCrawlerError),
    P.Effect.map((files) => P.Option.some({ _tag: TreeCrawlerDataType.Directory, level, path, data: files }))
  );
