import * as P from '@konker.dev/effect-ts-prelude';

import type { DirectoryData, Err } from '../../index';
import type { TinyFileSystem } from '../../lib/TinyFileSystem';

export const DefaultTreeCrawlerDirectoryHandler = (
  _tfs: TinyFileSystem,
  path: string,
  level: number
): P.Effect.Effect<never, Err, P.Option.Option<DirectoryData>> =>
  P.Effect.succeed(P.Option.some({ _tag: 'Directory', level, path }));
