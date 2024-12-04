import type * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { DirectoryData, FileData } from '../index';
import type { TinyTreeCrawlerError } from '../lib/error';

export type TreeCrawlerFileHandler = (
  tfs: TinyFileSystem,
  dirPath: string,
  fileName: string,
  level: number
) => P.Effect.Effect<P.Option.Option<FileData>, TinyTreeCrawlerError>;

export type TreeCrawlerDirectoryHandler = (
  tfs: TinyFileSystem,
  path: string,
  level: number
) => P.Effect.Effect<P.Option.Option<DirectoryData>, TinyTreeCrawlerError>;
