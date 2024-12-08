import type * as P from '@konker.dev/effect-ts-prelude';
import type * as E from '@konker.dev/tiny-event-fp';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';

import type { TreeCrawlerDirectoryFilter, TreeCrawlerFileFilter } from './filter/index.js';
import type { TreeCrawlerDirectoryHandler, TreeCrawlerFileHandler } from './handler/index.js';
import type { TinyTreeCrawlerError } from './lib/error.js';

// --------------------------------------------------------------------------
/**
 * Enum of possible event types which can be produced by a tree reader.
 */
export enum TreeCrawlerEvent {
  File = 'File',
  Directory = 'Directory',
  Started = 'Started',
  Finished = 'Finished',
}

export enum TreeCrawlerDataType {
  File = 'File',
  Directory = 'Directory',
}

/**
 * Event data type produced when a file is encountered.
 */
export type FileData = {
  _tag: TreeCrawlerDataType.File;
  path: string;
  level: number;
  data: ArrayBuffer;
};

/**
 * Event data type produced when a directory is encountered.
 */
export type DirectoryData = {
  _tag: TreeCrawlerDataType.Directory;
  path: string;
  level: number;
  data?: Array<string>;
};

export type TreeCrawlerData = FileData | DirectoryData;

// --------------------------------------------------------------------------
export const FILE = 0;
export const DIR = 1;
export type TreeCrawlerFilters = [TreeCrawlerFileFilter, TreeCrawlerDirectoryFilter];
export type TreeCrawlerHandlers = [TreeCrawlerFileHandler, TreeCrawlerDirectoryHandler];

// --------------------------------------------------------------------------
export type TreeCrawler<T extends TinyFileSystem = TinyFileSystem> = (
  tfs: T,
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  filters: TreeCrawlerFilters,
  handlers: TreeCrawlerHandlers
) => (dirPath: string, rootPath?: string, level?: number) => P.Effect.Effect<void, TinyTreeCrawlerError>;
