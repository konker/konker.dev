import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { FileData } from '../../index';
import type { TinyTreeCrawlerError } from '../../lib/error';

export const NoopTreeCrawlerFileHandler = (
  _tfs: TinyFileSystem,
  _dirPath: string,
  _fileName: string,
  _level: number
): P.Effect.Effect<never, TinyTreeCrawlerError, P.Option.Option<FileData>> => P.Effect.succeed(P.Option.none());
