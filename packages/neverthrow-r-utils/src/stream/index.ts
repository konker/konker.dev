/* eslint-disable fp/no-unused-expression,fp/no-mutation,fp/no-nil,fp/no-mutating-methods */
import type { Readable, Writable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

import { fromResultAsync, type ResultAsyncR } from '@konker.dev/neverthrow-r';
import { toError } from '@konker.dev/tiny-error-fp/lib';
import { ResultAsync } from 'neverthrow';

import { stringToUint8Array } from '../array.js';

/**
 * Consume a readStream
 * @param readStream
 */
export function readStreamToBuffer(readStream: Readable | ReadableStream): ResultAsyncR<unknown, Uint8Array, Error> {
  return fromResultAsync(
    ResultAsync.fromPromise(
      (async () => {
        const chunks: Array<Uint8Array> = [];
        // eslint-disable-next-line fp/no-loops
        for await (const chunk of readStream) {
          chunks.push(typeof chunk === 'string' ? stringToUint8Array(chunk) : new Uint8Array(chunk));
        }

        return chunks.reduce((acc, val) => new Uint8Array([...acc, ...val]), new Uint8Array());
      })(),
      toError
    )
  );
}

/**
 * Wait for a writable stream to finish
 */
export async function waitForWriteStreamPromise(writeStream: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

/**
 * Wait for a writable stream to finish
 */
export function waitForWriteStream(writeStream: Writable): ResultAsyncR<unknown, void, Error> {
  return fromResultAsync(ResultAsync.fromPromise(waitForWriteStreamPromise(writeStream), toError));
}

/**
 * Wait for a readable stream to fully pipe to a write-stream
 */
export function waitForStreamPipe(readStream: Readable, writeStream: Writable): ResultAsyncR<unknown, number, Error> {
  return fromResultAsync(
    ResultAsync.fromPromise(
      new Promise<number>((resolve, reject) => {
        // eslint-disable-next-line fp/no-let
        let size = 0;
        readStream.on('data', (data: string) => {
          size = size + data.length;
        });
        readStream.on('error', reject);
        writeStream.on('finish', () => resolve(size));
        writeStream.on('error', reject);
        readStream.pipe(writeStream);
        readStream.resume();
      }),
      toError
    )
  );
}
