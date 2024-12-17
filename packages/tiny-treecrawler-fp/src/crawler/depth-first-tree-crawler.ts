import * as E from '@konker.dev/tiny-event-fp';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { FileType } from '@konker.dev/tiny-filesystem-fp';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { TreeCrawler, TreeCrawlerData, TreeCrawlerFilters, TreeCrawlerHandlers } from '../index.js';
import { DIR, FILE, TreeCrawlerEvent } from '../index.js';
import type { TinyTreeCrawlerError } from '../lib/error.js';
import { toTinyTreeCrawlerError } from '../lib/error.js';
import { DIRECTORIES_FIRST, sortListingByFileType } from '../lib/utils.js';
import { notifyDirectoryEvent, notifyFileEvent } from './index.js';

export const DepthFirstTreeCrawler: TreeCrawler = (
  tfs: TinyFileSystem,
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  filters: TreeCrawlerFilters,
  handlers: TreeCrawlerHandlers
) => {
  const crawlTree = (dirPath: string, rootPath: string, level: number): Effect.Effect<void, TinyTreeCrawlerError> => {
    return pipe(
      // Apply directory handler
      handlers[DIR](tfs, dirPath, level),

      // Notify directory event if there is some data from the handler
      Effect.tap((directoryData) => notifyDirectoryEvent(events, directoryData)),

      // List directory children
      Effect.flatMap(() => tfs.listFiles(dirPath)),

      // Sort children, directories first
      Effect.flatMap(sortListingByFileType(tfs, DIRECTORIES_FIRST)),

      // Process the children in order
      Effect.flatMap((children) =>
        Effect.forEach(children, ({ childPath, fileType }) => {
          if (fileType === FileType.Directory) {
            // Process subdirectory
            const subDirName = tfs.relative(dirPath, childPath);
            return pipe(
              Effect.Do,
              Effect.bind('subDirPath', () => tfs.joinPath(dirPath, subDirName)),
              Effect.bind('filterResult', ({ subDirPath }) => {
                return filters[DIR](tfs, rootPath, subDirPath, subDirName, level + 1);
              }),
              Effect.flatMap(({ filterResult, subDirPath }) =>
                filterResult ? crawlTree(subDirPath, rootPath, level + 1) : Effect.void
              )
            );
          }

          // Process file
          return pipe(
            Effect.Do,
            Effect.bind('fileName', () => tfs.fileName(childPath)),
            Effect.bind('filterResult', ({ fileName }) => filters[FILE](tfs, rootPath, dirPath, fileName, level + 1)),
            Effect.flatMap(({ fileName, filterResult }) =>
              filterResult
                ? pipe(
                    handlers[FILE](tfs, dirPath, fileName, level + 1),
                    Effect.tap((fileData) => notifyFileEvent(events, fileData)),
                    Effect.flatMap(() => Effect.void)
                  )
                : Effect.void
            )
          );
        })
      ),

      // Narrow errors
      Effect.mapError(toTinyTreeCrawlerError)
    );
  };

  return (dirPath: string, rootPath: string = dirPath, level = 0) =>
    pipe(
      Effect.void,

      // Notify `Started` event
      Effect.tap(() => pipe(events, E.notify(TreeCrawlerEvent.Started))),

      Effect.flatMap(() => crawlTree(dirPath, rootPath, level)),

      // Notify Finished event
      Effect.tap(() => pipe(events, E.notify(TreeCrawlerEvent.Finished))),

      // Narrow errors
      Effect.mapError(toTinyTreeCrawlerError)
    );
};

// --------------------------------------------------------------------------
