import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { Err, FileData } from '../../index';

export const NoopTreeCrawlerFileHandler = (
  _tfs: TinyFileSystem,
  _dirPath: string,
  _fileName: string,
  _level: number
): P.Effect.Effect<never, Err, P.Option.Option<FileData>> => P.Effect.succeed(P.Option.none());
