import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { DirectoryData, Err } from '../../index';

export const DefaultTreeCrawlerDirectoryHandler = (
  _tfs: TinyFileSystem,
  path: string,
  level: number
): P.Effect.Effect<never, Err, P.Option.Option<DirectoryData>> =>
  P.Effect.succeed(P.Option.some({ _tag: 'Directory', level, path }));
