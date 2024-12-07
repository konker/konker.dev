/* eslint-disable fp/no-unused-expression,fp/no-mutation,fp/no-nil,fp/no-mutating-methods */
import type { Readable, Writable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

import * as P from '@konker.dev/effect-ts-prelude';
import { toError } from '@konker.dev/effect-ts-prelude';

import { stringToUint8Array } from '../array';

/**
 * Consume a readStream
 * @param readStream
 */
export function readStreamToBuffer(readStream: Readable | ReadableStream): P.Effect.Effect<Uint8Array, Error> {
  return P.Effect.tryPromise({
    try: async () => {
      const chunks: Array<Uint8Array> = [];
      // eslint-disable-next-line fp/no-loops
      for await (const chunk of readStream) {
        chunks.push(typeof chunk === 'string' ? stringToUint8Array(chunk) : new Uint8Array(chunk));
      }

      // Merge chunks
      return chunks.reduce((acc, val) => new Uint8Array([...acc, ...val]), new Uint8Array());
    },
    catch: toError,
  });
}

/**
 * Wait for a writable stream to finish
 */
export function waitForWriteStreamPromise(writeStream: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

/**
 * Wait for a writable stream to finish
 */
export function waitForWriteStream(writeStream: Writable): P.Effect.Effect<void, Error> {
  return P.Effect.tryPromise({
    try: () =>
      new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      }),
    catch: toError,
  });
}

/**
 * Wait for a readable stream to fully pipe to a write-stream
 */
export function waitForStreamPipe(readStream: Readable, writeStream: Writable): P.Effect.Effect<number, Error> {
  return P.Effect.tryPromise({
    try: () =>
      new Promise((resolve, reject) => {
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
    catch: toError,
  });
}
