import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import * as Effect from 'effect/Effect';

import type { TreeCrawlerDirectoryFilter } from '../index.js';

export const TrueDirectoryFilter: TreeCrawlerDirectoryFilter = (
  _tfs: TinyFileSystem,
  _rootPath: string,
  _dirPath: string,
  _dirName: string,
  _level: number
) => Effect.succeed(true);
