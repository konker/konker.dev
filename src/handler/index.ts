// --------------------------------------------------------------------------
import type * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { DirectoryData, Err, FileData } from '../index';

export type TreeCrawlerFileHandler = (
  tfs: TinyFileSystem,
  dirPath: string,
  fileName: string,
  level: number
) => P.Effect.Effect<never, Err, P.Option.Option<FileData>>;

export type TreeCrawlerDirectoryHandler = (
  tfs: TinyFileSystem,
  path: string,
  level: number
) => P.Effect.Effect<never, Err, P.Option.Option<DirectoryData>>;
