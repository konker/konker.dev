import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import type { Option } from 'effect';
import type * as Effect from 'effect/Effect';

import type { DirectoryData, FileData } from '../index.js';
import type { TinyTreeCrawlerError } from '../lib/error.js';

export type TreeCrawlerFileHandler = (
  tfs: TinyFileSystem,
  dirPath: string,
  fileName: string,
  level: number
) => Effect.Effect<Option.Option<FileData>, TinyTreeCrawlerError>;

export type TreeCrawlerDirectoryHandler = (
  tfs: TinyFileSystem,
  path: string,
  level: number
) => Effect.Effect<Option.Option<DirectoryData>, TinyTreeCrawlerError>;
