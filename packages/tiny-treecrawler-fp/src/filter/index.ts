import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { Array, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { TinyTreeCrawlerError } from '../lib/error.js';

export type TreeCrawlerDirectoryFilter<T extends TinyFileSystem = TinyFileSystem> = (
  tfs: T,
  rootPath: string,
  dirPath: string,
  dirName: string,
  level: number
) => Effect.Effect<boolean, TinyTreeCrawlerError>;

export type TreeCrawlerFileFilter<T extends TinyFileSystem = TinyFileSystem> = (
  tfs: T,
  rootPath: string,
  dirPath: string,
  fileName: string,
  level: number
) => Effect.Effect<boolean, TinyTreeCrawlerError>;

export const sequenceFileFilters =
  (filters: Array<TreeCrawlerFileFilter>): TreeCrawlerFileFilter =>
  (tfs, rootPath, dirPath, fileName, level) =>
    pipe(
      filters,
      Array.map((filter) => filter(tfs, rootPath, dirPath, fileName, level)),
      Effect.every((result) => result)
    );

export const sequenceDirectoryFilters =
  (filters: Array<TreeCrawlerDirectoryFilter>): TreeCrawlerDirectoryFilter =>
  (tfs, rootPath, dirPath, fileName, level) =>
    pipe(
      filters,
      Array.map((filter) => filter(tfs, rootPath, dirPath, fileName, level)),
      Effect.every((result) => result)
    );
