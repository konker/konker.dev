import type { Readable, Writable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

import * as P from '@konker.dev/effect-ts-prelude';
import { toError } from '@konker.dev/effect-ts-prelude';
import readline from 'readline';

import { stringToUint8Array } from './array';
import type { TinyFileSystemError } from './error';
import { toTinyFileSystemError } from './error';

/**
 * Consume a readStream
 * @param readStream
 */
export function readStreamToBuffer(readStream: Readable | ReadableStream): P.Effect.Effect<Uint8Array, Error> {
  return P.Effect.tryPromise({
    try: async () => {
      const chunks: Array<Uint8Array> = [];
      // FIXME: disabled lint
      // eslint-disable-next-line fp/no-loops,fp/no-nil
      for await (const chunk of readStream) {
        // eslint-disable-next-line fp/no-mutating-methods,fp/no-unused-expression
        chunks.push(typeof chunk === 'string' ? stringToUint8Array(chunk) : new Uint8Array(chunk));
      }

      // Merge chunks
      return chunks.reduce((acc, val) => new Uint8Array([...acc, ...val]), new Uint8Array());
    },
    catch: toError,
  });
}

/**
 * Wait for a readable stream to fully pipe to a write-stream
 */
export function waitForStreamPipe(readStream: Readable, writeStream: Writable): P.Effect.Effect<number, Error> {
  return P.Effect.tryPromise({
    try: () =>
      // eslint-disable-next-line fp/no-nil
      new Promise((resolve, reject) => {
        // eslint-disable-next-line fp/no-let
        let size = 0;
        // eslint-disable-next-line fp/no-unused-expression,fp/no-nil
        readStream.on('data', (data) => {
          // eslint-disable-next-line fp/no-mutation
          size = size + data.length;
        });
        // eslint-disable-next-line fp/no-unused-expression
        readStream.on('error', reject);
        // eslint-disable-next-line fp/no-unused-expression
        writeStream.on('finish', () => resolve(size));
        // eslint-disable-next-line fp/no-unused-expression
        writeStream.on('error', reject);
        // eslint-disable-next-line fp/no-unused-expression
        readStream.pipe(writeStream);
        // eslint-disable-next-line fp/no-unused-expression
        readStream.resume();
      }),
    catch: toError,
  });
}

export function readlineInterfaceFromReadStream(
  readStream: Readable
): P.Effect.Effect<readline.Interface, TinyFileSystemError> {
  return P.Effect.tryPromise({
    try: async () =>
      readline.createInterface({
        input: readStream,
        historySize: 0,
        terminal: false,
        crlfDelay: Infinity,
        escapeCodeTimeout: 10000,
      }),
    catch: toTinyFileSystemError,
  });
}
