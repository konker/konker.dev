import * as E from '@konker.dev/tiny-event-fp';
import { Option, pipe } from 'effect';
import * as Effect from 'effect/Effect';

import { type DirectoryData, type FileData, type TreeCrawlerData, TreeCrawlerEvent } from '../index';
import type { TinyTreeCrawlerError } from '../lib/error';
import { toTinyTreeCrawlerError } from '../lib/error';

export function notifyDirectoryEvent(
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  directoryData: Option.Option<DirectoryData>
): Effect.Effect<void, TinyTreeCrawlerError> {
  return pipe(
    directoryData,
    Option.match({
      onSome: (directoryData) =>
        pipe(events, E.notify(TreeCrawlerEvent.Directory, directoryData), Effect.mapError(toTinyTreeCrawlerError)),
      onNone: () => Effect.void,
    })
  );
}

export function notifyFileEvent(
  events: E.TinyEventDispatcher<TreeCrawlerEvent, TreeCrawlerData>,
  fileData: Option.Option<FileData>
): Effect.Effect<void, TinyTreeCrawlerError> {
  return pipe(
    fileData,
    Option.match({
      onSome: (fileData) =>
        pipe(events, E.notify(TreeCrawlerEvent.File, fileData), Effect.mapError(toTinyTreeCrawlerError)),
      onNone: () => Effect.void,
    })
  );
}
