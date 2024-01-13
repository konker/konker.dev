import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { TreeCrawlerDirectoryFilter } from '../index';

export const TrueDirectoryFilter: TreeCrawlerDirectoryFilter = (
  _tfs: TinyFileSystem,
  _rootPath: string,
  _dirPath: string,
  _dirName: string,
  _level: number
) => P.Effect.succeed(true);
