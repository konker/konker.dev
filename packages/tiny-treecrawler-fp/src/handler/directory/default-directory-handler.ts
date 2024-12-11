import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { Option } from 'effect';
import * as Effect from 'effect/Effect';

import type { DirectoryData } from '../../index';
import { TreeCrawlerDataType } from '../../index';
import type { TinyTreeCrawlerError } from '../../lib/error';

export const DefaultTreeCrawlerDirectoryHandler = (
  _tfs: TinyFileSystem,
  path: string,
  level: number
): Effect.Effect<Option.Option<DirectoryData>, TinyTreeCrawlerError> =>
  Effect.succeed(Option.some({ _tag: TreeCrawlerDataType.Directory, level, path }));
