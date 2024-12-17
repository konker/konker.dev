import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { Option } from 'effect';
import * as Effect from 'effect/Effect';

import type { DirectoryData } from '../../index.js';
import type { TinyTreeCrawlerError } from '../../lib/error.js';

export const NoopTreeCrawlerDirectoryHandler = (
  _tfs: TinyFileSystem,
  _path: string,
  _level: number
): Effect.Effect<Option.Option<DirectoryData>, TinyTreeCrawlerError> => Effect.succeed(Option.none());
