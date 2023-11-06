// --------------------------------------------------------------------------
import type * as P from '@konker.dev/effect-ts-prelude';

import type { Err } from '../index';
import type { TinyFileSystem } from '../lib/TinyFileSystem';

export type TreeCrawlerDirectoryFilter = (
  tfs: TinyFileSystem,
  rootPath: string,
  dirPath: string,
  dirName: string,
  level: number
) => P.Effect.Effect<never, Err, boolean>;

export type TreeCrawlerFileFilter = (
  tfs: TinyFileSystem,
  rootPath: string,
  dirPath: string,
  fileName: string,
  level: number
) => P.Effect.Effect<never, Err, boolean>;
