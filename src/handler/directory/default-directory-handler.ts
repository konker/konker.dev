import * as P from '@konker.dev/effect-ts-prelude';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { DirectoryData } from '../../index';
import { TreeCrawlerDataType } from '../../index';
import type { TinyTreeCrawlerError } from '../../lib/error';

export const DefaultTreeCrawlerDirectoryHandler = (
  _tfs: TinyFileSystem,
  path: string,
  level: number
): P.Effect.Effect<never, TinyTreeCrawlerError, P.Option.Option<DirectoryData>> =>
  P.Effect.succeed(P.Option.some({ _tag: TreeCrawlerDataType.Directory, level, path }));
