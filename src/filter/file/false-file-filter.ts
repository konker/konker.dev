import * as P from '@konker.dev/effect-ts-prelude';

import type { TinyFileSystem } from '../../lib/TinyFileSystem';
import type { TreeCrawlerFileFilter } from '../index';

export const IdentityFileFilter: TreeCrawlerFileFilter = (
  _tfs: TinyFileSystem,
  _rootPath: string,
  _dirPath: string,
  _fileName: string,
  _level: number
) => P.Effect.succeed(false);
