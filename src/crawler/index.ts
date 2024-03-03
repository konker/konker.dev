import * as P from '@konker.dev/effect-ts-prelude';
import * as E from '@konker.dev/tiny-event-fp';

import { type DirectoryData, type FileData, type TreeCrawlerData, TreeCrawlerEvent } from '../index';
import type { TinyTreeCrawlerError } from '../lib/error';
import { toTinyTreeCrawlerError } from '../lib/error';

export function notifyDirectoryEvent(
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  directoryData: P.Option.Option<DirectoryData>
): P.Effect.Effect<void, TinyTreeCrawlerError> {
  return P.pipe(
    directoryData,
    P.Option.match({
      onSome: (directoryData) =>
        P.pipe(events, E.notify(TreeCrawlerEvent.Directory, directoryData), P.Effect.mapError(toTinyTreeCrawlerError)),
      onNone: () => P.Effect.unit,
    })
  );
}

export function notifyFileEvent(
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  fileData: P.Option.Option<FileData>
): P.Effect.Effect<void, TinyTreeCrawlerError> {
  return P.pipe(
    fileData,
    P.Option.match({
      onSome: (fileData) =>
        P.pipe(events, E.notify(TreeCrawlerEvent.File, fileData), P.Effect.mapError(toTinyTreeCrawlerError)),
      onNone: () => P.Effect.unit,
    })
  );
}
