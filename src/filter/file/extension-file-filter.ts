import * as P from '@konker.dev/effect-ts-prelude';

import type { TinyFileSystem } from '../../lib/TinyFileSystem';
import type { TreeCrawlerFileFilter } from '../index';

export const ExtensionFileFilter =
  (extensionAllowList: Array<string>): TreeCrawlerFileFilter =>
  (tfs: TinyFileSystem, _rootPath: string, _dirPath: string, fileName: string, _level: number) =>
    extensionAllowList.some((ext) => ext.toLowerCase() === tfs.extname(fileName).toLocaleLowerCase())
      ? P.Effect.succeed(true)
      : P.Effect.succeed(false);
