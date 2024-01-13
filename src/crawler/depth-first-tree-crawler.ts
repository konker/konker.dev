import * as P from '@konker.dev/effect-ts-prelude';
import * as E from '@konker.dev/tiny-event-fp';
import type { TinyFileSystem } from '@konker.dev/tiny-filesystem-fp';
import { FileType } from '@konker.dev/tiny-filesystem-fp';

import type { TreeCrawler, TreeCrawlerData, TreeCrawlerFilters, TreeCrawlerHandlers } from '../index';
import { DIR, FILE, TreeCrawlerEvent } from '../index';
import type { TinyTreeCrawlerError } from '../lib/error';
import { toTinyTreeCrawlerError } from '../lib/error';
import { DIRECTORIES_FIRST, sortListingByFileType } from '../lib/utils';
import { notifyDirectoryEvent, notifyFileEvent } from './index';

export const DepthFirstTreeCrawler: TreeCrawler = (
  tfs: TinyFileSystem,
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  filters: TreeCrawlerFilters,
  handlers: TreeCrawlerHandlers
) => {
  const crawlTree = (
    dirPath: string,
    rootPath: string,
    level: number
  ): P.Effect.Effect<never, TinyTreeCrawlerError, void> => {
    return P.pipe(
      // Apply directory handler
      handlers[DIR](tfs, dirPath, level),

      // Notify directory event if there is some data from the handler
      P.Effect.tap((directoryData) => notifyDirectoryEvent(events, directoryData)),

      // List directory children
      P.Effect.flatMap(() => tfs.listFiles(dirPath)),

      // Sort children, directories first
      P.Effect.flatMap(sortListingByFileType(tfs, DIRECTORIES_FIRST)),

      // Process the children in order
      P.Effect.flatMap((children) =>
        P.Effect.forEach(children, ({ childPath, fileType }) => {
          if (fileType === FileType.Directory) {
            // Process subdirectory
            const subDirName = tfs.relative(dirPath, childPath);
            return P.pipe(
              P.Effect.Do,
              P.Effect.bind('subDirPath', () => tfs.joinPath(dirPath, subDirName)),
              P.Effect.bind('filterResult', ({ subDirPath }) => {
                return filters[DIR](tfs, rootPath, subDirPath, subDirName, level + 1);
              }),
              P.Effect.flatMap(({ filterResult, subDirPath }) =>
                filterResult ? crawlTree(subDirPath, rootPath, level + 1) : P.Effect.unit
              )
            );
          }

          // Process file
          return P.pipe(
            P.Effect.Do,
            P.Effect.bind('fileName', () => tfs.fileName(childPath)),
            P.Effect.bind('filterResult', ({ fileName }) => filters[FILE](tfs, rootPath, dirPath, fileName, level + 1)),
            P.Effect.flatMap(({ fileName, filterResult }) =>
              filterResult
                ? P.pipe(
                    handlers[FILE](tfs, dirPath, fileName, level + 1),
                    P.Effect.tap((fileData) => notifyFileEvent(events, fileData)),
                    P.Effect.flatMap(() => P.Effect.unit)
                  )
                : P.Effect.unit
            )
          );
        })
      ),

      // Narrow errors
      P.Effect.mapError(toTinyTreeCrawlerError)
    );
  };

  return (dirPath: string, rootPath: string = dirPath, level = 0) =>
    P.pipe(
      P.Effect.unit,

      // Notify `Started` event
      P.Effect.tap(() => P.pipe(events, E.notify(TreeCrawlerEvent.Started))),

      P.Effect.flatMap(() => crawlTree(dirPath, rootPath, level)),

      // Notify Finished event
      P.Effect.tap(() => P.pipe(events, E.notify(TreeCrawlerEvent.Finished))),

      // Narrow errors
      P.Effect.mapError(toTinyTreeCrawlerError)
    );
};

// --------------------------------------------------------------------------
