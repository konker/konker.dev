import type * as P from '@konker.dev/effect-ts-prelude';
import type * as E from '@konker.dev/tiny-event-fp';

import type { TreeCrawlerDirectoryFilter, TreeCrawlerFileFilter } from './filter';
import type { TreeCrawlerDirectoryHandler, TreeCrawlerFileHandler } from './handler';
import type { TinyFileSystemError } from './lib/error';
import type { TinyFileSystem } from './lib/TinyFileSystem';

export type Err = TinyFileSystemError;

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

/**
 * Event data type produced when a file is encountered.
 */
export type FileData = {
  _tag: 'File';
  path: string;
  level: number;
  data: Array<unknown>;
};

/**
 * Event data type produced when a directory is encountered.
 */
export type DirectoryData = {
  _tag: 'Directory';
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
export type TreeCrawler = (
  tfs: TinyFileSystem,
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  filters: TreeCrawlerFilters,
  handlers: TreeCrawlerHandlers
) => (dirPath: string, rootPath?: string, level?: number) => P.Effect.Effect<never, Err, void>;

// --------------------------------------------------------------------------
