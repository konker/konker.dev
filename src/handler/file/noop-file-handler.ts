import * as P from '@konker.dev/effect-ts-prelude';

import type { Err, FileData } from '../../index';
import type { TinyFileSystem } from '../../lib/TinyFileSystem';

export const NoopTreeCrawlerFileHandler = (
  _tfs: TinyFileSystem,
  _dirPath: string,
  _fileName: string,
  _level: number
): P.Effect.Effect<never, Err, P.Option.Option<FileData>> => P.Effect.succeed(P.Option.none());
