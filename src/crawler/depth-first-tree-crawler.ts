import * as P from '@konker.dev/effect-ts-prelude';
import * as E from '@konker.dev/tiny-event-fp';

import type {
  DirectoryData,
  Err,
  FileData,
  TreeCrawler,
  TreeCrawlerData,
  TreeCrawlerFilters,
  TreeCrawlerHandlers,
} from '../index';
import { DIR, FILE, TreeCrawlerEvent } from '../index';
import type { TinyFileSystemError } from '../lib/error';
import { toTinyFileSystemError } from '../lib/error';
import type { TinyFileSystem } from '../lib/TinyFileSystem';
import { FileType } from '../lib/TinyFileSystem';
import { DIRECTORIES_FIRST, sortListingByFileType } from '../lib/utils';

export function notifyDirectoryEvent(
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  directoryData: P.Option.Option<DirectoryData>
): P.Effect.Effect<never, TinyFileSystemError, void> {
  return P.pipe(
    directoryData,
    P.Option.match({
      onSome: (directoryData) =>
        P.pipe(
          events,
          E.notify(TreeCrawlerEvent.Directory, directoryData),
          (x) => x,
          P.Effect.mapError(toTinyFileSystemError),
          P.Effect.flatMap(() => P.Effect.unit)
        ),
      onNone: () => P.Effect.unit,
    })
  );
}

export function notifyFileEvent(
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  fileData: P.Option.Option<FileData>
): P.Effect.Effect<never, TinyFileSystemError, void> {
  return P.pipe(
    fileData,
    P.Option.match({
      onSome: (fileData) =>
        P.pipe(
          events,
          E.notify(TreeCrawlerEvent.File, fileData),
          P.Effect.mapError(toTinyFileSystemError),
          P.Effect.flatMap(() => P.Effect.unit)
        ),
      onNone: () => P.Effect.unit,
    })
  );
}

export const DepthFirstTreeCrawler: TreeCrawler = (
  tfs: TinyFileSystem,
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  filters: TreeCrawlerFilters,
  handlers: TreeCrawlerHandlers
) => {
  const crawlTree = (dirPath: string, rootPath: string = dirPath, level = 0): P.Effect.Effect<never, Err, void> => {
    return P.pipe(
      // Apply directory handler
      handlers[DIR](tfs, dirPath, level),
      (x) => x,

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
      )
    );
  };

  return crawlTree;
};

// --------------------------------------------------------------------------
