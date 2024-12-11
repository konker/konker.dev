import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { Option } from 'effect';
import * as Effect from 'effect/Effect';

import type { FileData } from '../../index';
import type { TinyTreeCrawlerError } from '../../lib/error';

export const NoopTreeCrawlerFileHandler = (
  _tfs: TinyFileSystem,
  _dirPath: string,
  _fileName: string,
  _level: number
): Effect.Effect<Option.Option<FileData>, TinyTreeCrawlerError> => Effect.succeed(Option.none());
