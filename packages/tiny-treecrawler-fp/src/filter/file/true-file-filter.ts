import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import * as Effect from 'effect/Effect';

import type { TreeCrawlerFileFilter } from '../index';

export const TrueFileFilter: TreeCrawlerFileFilter = (
  _tfs: TinyFileSystem,
  _rootPath: string,
  _dirPath: string,
  _fileName: string,
  _level: number
) => Effect.succeed(true);
