import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { TinyTreeCrawlerError } from '../lib/error';

export type TreeCrawlerDirectoryFilter<T extends TinyFileSystem = TinyFileSystem> = (
  tfs: T,
  rootPath: string,
  dirPath: string,
  dirName: string,
  level: number
) => P.Effect.Effect<never, TinyTreeCrawlerError, boolean>;

export type TreeCrawlerFileFilter<T extends TinyFileSystem = TinyFileSystem> = (
  tfs: T,
  rootPath: string,
  dirPath: string,
  fileName: string,
  level: number
) => P.Effect.Effect<never, TinyTreeCrawlerError, boolean>;

export const sequenceFileFilters =
  (filters: Array<TreeCrawlerFileFilter>): TreeCrawlerFileFilter =>
  (tfs, rootPath, dirPath, fileName, level) =>
    P.pipe(
      filters,
      P.Array.map((filter) => filter(tfs, rootPath, dirPath, fileName, level)),
      P.Effect.every((result) => result)
    );

export const sequenceDirectoryFilters =
  (filters: Array<TreeCrawlerDirectoryFilter>): TreeCrawlerDirectoryFilter =>
  (tfs, rootPath, dirPath, fileName, level) =>
    P.pipe(
      filters,
      P.Array.map((filter) => filter(tfs, rootPath, dirPath, fileName, level)),
      P.Effect.every((result) => result)
    );
