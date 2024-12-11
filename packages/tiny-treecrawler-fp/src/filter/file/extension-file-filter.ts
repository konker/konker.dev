import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import * as Effect from 'effect/Effect';

import type { TreeCrawlerFileFilter } from '../index';

export const ExtensionFileFilter =
  (extensionAllowList: Array<string>): TreeCrawlerFileFilter =>
  (tfs: TinyFileSystem, _rootPath: string, _dirPath: string, fileName: string, _level: number) =>
    extensionAllowList.some((ext) => ext.toLowerCase() === tfs.extname(fileName).toLocaleLowerCase())
      ? Effect.succeed(true)
      : Effect.succeed(false);
