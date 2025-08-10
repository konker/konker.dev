import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

import type * as s3Client from '@aws-sdk/client-s3';
import type { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { toError } from '@konker.dev/tiny-error-fp/lib';
import { PromiseDependentWritableStream } from '@konker.dev/tiny-utils-fp/stream/PromiseDependentWritableStream';
import * as Effect from 'effect/Effect';

export function s3ObjectIsReadable(resp: unknown): resp is { readonly Body: Readable } {
  return !!resp && typeof resp === 'object' && 'Body' in resp && resp.Body instanceof Readable;
}

export function UploadObjectEffect(
  client: S3Client,
  params: s3Client.PutObjectCommandInput,
  data: Buffer | string
): Effect.Effect<void, Error> {
  return Effect.tryPromise({
    // eslint-disable-next-line fp/no-nil
    try: async () => {
      const buf = data instanceof Buffer ? data : Buffer.from(data);
      const upload = new Upload({
        client,
        leavePartsOnError: false,
        params: {
          Bucket: params.Bucket,
          Key: params.Key,
          Body: buf,
          ContentLength: buf.length,
        },
      });

      // eslint-disable-next-line fp/no-unused-expression
      await upload.done();
    },
    catch: toError,
  });
}

export function UploadObjectWriteStreamEffect(
  client: S3Client,
  params: s3Client.PutObjectCommandInput
): Effect.Effect<PromiseDependentWritableStream, Error> {
  return Effect.tryPromise({
    try: async () => {
      const promiseDependentWritableStream = new PromiseDependentWritableStream();
      const upload = new Upload({
        client,
        leavePartsOnError: false,
        params: {
          Bucket: params.Bucket,
          Key: params.Key,
          Body: promiseDependentWritableStream,
        },
      });

      // eslint-disable-next-line fp/no-mutation
      promiseDependentWritableStream.promise = upload.done();
      return promiseDependentWritableStream;
    },
    catch: toError,
  });
}
