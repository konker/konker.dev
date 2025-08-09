import type * as s3Client from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { RequestPresigningArguments } from '@aws-sdk/types';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { S3EchoParams } from './index.js';
import { S3ClientDeps } from './index.js';
import type { S3Error } from './lib/error.js';
import { toS3Error } from './lib/error.js';
import { PromiseDependentWritableStream } from './lib/PromiseDependentWritableStream.js';

export function GetSignedUrlEffect(
  params: s3Client.GetObjectCommandInput,
  options?: RequestPresigningArguments
): Effect.Effect<{ readonly result: string } & S3EchoParams<s3Client.GetObjectCommandInput>, S3Error, S3ClientDeps> {
  return pipe(
    S3ClientDeps,
    Effect.flatMap((deps) =>
      Effect.tryPromise({
        try: async () => {
          const cmd = new GetObjectCommand(params);
          const result = await getSignedUrl(deps.s3Client, cmd, options);
          return { result, _Params: params };
        },
        catch: toS3Error(params),
      })
    )
  );
}

export function UploadObjectEffect(
  params: s3Client.PutObjectCommandInput,
  data: Buffer | string
): Effect.Effect<void, S3Error, S3ClientDeps> {
  return pipe(
    S3ClientDeps,
    Effect.flatMap((deps) =>
      Effect.tryPromise({
        // eslint-disable-next-line fp/no-nil
        try: async () => {
          const buf = data instanceof Buffer ? data : Buffer.from(data);
          const upload = new Upload({
            client: deps.s3Client,
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
        catch: toS3Error(params),
      })
    )
  );
}

export function UploadObjectWriteStreamEffect(
  params: s3Client.PutObjectCommandInput
): Effect.Effect<PromiseDependentWritableStream, S3Error, S3ClientDeps> {
  return pipe(
    S3ClientDeps,
    Effect.flatMap((deps) =>
      Effect.tryPromise({
        try: async () => {
          const promiseDependentWritableStream = new PromiseDependentWritableStream();
          const upload = new Upload({
            client: deps.s3Client,
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
        catch: toS3Error(params),
      })
    )
  );
}
