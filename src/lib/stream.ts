import type { Readable, Writable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

import * as P from '@konker.dev/effect-ts-prelude';
import { toError } from '@konker.dev/effect-ts-prelude';
import readline from 'readline';

import type { PromiseDependentWritableStream } from '../../dist/lib/PromiseDependentWritableStream';
import type { S3Error } from '../../dist/lib/s3-client-fp';
import { toS3Error } from '../../dist/lib/s3-client-fp';

/**
 * Consume a readStream
 * @param readStream
 */
export function readStreamToBuffer(readStream: Readable | ReadableStream): P.Effect.Effect<never, Error, Buffer> {
  return P.Effect.tryPromise({
    try: async () => {
      const chunks: Array<Buffer> = [];
      // FIXME: disabled lint
      // eslint-disable-next-line fp/no-loops,fp/no-nil
      for await (const chunk of readStream) {
        // eslint-disable-next-line fp/no-mutating-methods,fp/no-unused-expression
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    },
    catch: toError,
  });
}

/**
 * Wait for a readable stream to fully pipe to a write-stream
 */
export function waitForStreamPipe(readStream: Readable, writeStream: Writable): P.Effect.Effect<never, Error, number> {
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

/**
 * Wait for a readable stream to fully pipe to a S3UploadStream
 */
export function waitForPromiseDependentWritableStreamPipe(
  readStream: Readable,
  writeStream: PromiseDependentWritableStream
): P.Effect.Effect<never, Error, number> {
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
        readStream.pipe(writeStream);
        // eslint-disable-next-line fp/no-unused-expression
        readStream.resume();
        // eslint-disable-next-line fp/no-unused-expression
        if (writeStream.promise) writeStream.promise.then(() => resolve(size)).catch(reject);
        // eslint-disable-next-line fp/no-unused-expression
        else reject(Error('waitForPromiseDependentWritableStreamPipe called without a stream promise'));
      }),
    catch: toError,
  });
}

export function readlineInterfaceFromReadStream(
  readStream: Readable
): P.Effect.Effect<never, S3Error, readline.Interface> {
  return P.Effect.tryPromise({
    try: async () =>
      readline.createInterface({
        input: readStream,
        historySize: 0,
        terminal: false,
        crlfDelay: Infinity,
        escapeCodeTimeout: 10000,
      }),
    catch: toS3Error({}),
  });
}
