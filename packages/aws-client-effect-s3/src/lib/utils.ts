/* eslint-disable fp/no-unused-expression,fp/no-let,fp/no-nil */
import type { Readable } from 'node:stream';

import * as P from '@konker.dev/effect-ts-prelude';

import type { PromiseDependentWritableStream } from './PromiseDependentWritableStream';

/**
 * Wait for a readable stream to fully pipe to a PromiseDependentWritableStream sink
 */
export function waitForPromiseDependentWritableStreamPipe(
  readStream: Readable,
  writeStream: PromiseDependentWritableStream
): P.Effect.Effect<number, Error> {
  return P.Effect.tryPromise({
    try: () =>
      new Promise((resolve, reject) => {
        let size = 0;
        readStream.on('data', (data) => {
          // eslint-disable-next-line fp/no-mutation
          size = size + data.length;
        });
        readStream.on('error', reject);
        readStream.pipe(writeStream);
        readStream.resume();
        if (writeStream.promise) writeStream.promise.then(() => resolve(size)).catch(reject);
        else reject(Error('waitForPromiseDependentWritableStreamPipe called without a stream promise'));
      }),
    catch: P.toError,
  });
}
