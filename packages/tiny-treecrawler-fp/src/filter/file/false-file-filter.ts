import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { TreeCrawlerFileFilter } from '../index';

export const FalseFileFilter: TreeCrawlerFileFilter = (
  _tfs: TinyFileSystem,
  _rootPath: string,
  _dirPath: string,
  _fileName: string,
  _level: number
) => P.Effect.succeed(false);
