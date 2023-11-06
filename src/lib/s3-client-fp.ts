import type { S3Client } from '@aws-sdk/client-s3';
import * as s3Client from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Command, HttpHandlerOptions, RequestPresigningArguments } from '@aws-sdk/types';
import * as P from '@konker.dev/effect-ts-prelude';
import type { SmithyResolvedConfiguration } from '@smithy/smithy-client/dist-types';
import { Readable } from 'stream';

import { PromiseDependentWritableStream } from './PromiseDependentWritableStream';

export type S3Error = Error & { _tag: 'S3Error'; _Params: unknown };

// FIXME: Effect Layers?
export type S3ClientFactory = (config: s3Client.S3ClientConfig) => s3Client.S3Client;
export const defaultS3ClientFactory: S3ClientFactory = (config: s3Client.S3ClientConfig) =>
  new s3Client.S3Client(config);

export type S3FactoryDeps = {
  readonly s3ClientFactory: S3ClientFactory;
};
export const S3FactoryDeps = P.Context.Tag<S3FactoryDeps>('@s3-client-fp/S3FactoryDeps');

export const defaultS3FactoryDeps = P.Effect.provideService(
  S3FactoryDeps,
  S3FactoryDeps.of({
    s3ClientFactory: defaultS3ClientFactory,
  })
);

//------------------------------------------------------
export type S3ClientDeps = {
  readonly s3Client: S3Client; //Client<s3Client.ServiceInputTypes, s3Client.ServiceOutputTypes, unknown>;
};
export const S3ClientDeps = P.Context.Tag<S3ClientDeps>('s3-client-fp/S3ClientDeps');

export type S3EchoParams<I> = { _Params: I };

export const toS3Error =
  <I>(params: I) =>
  (x: unknown): S3Error => {
    return x instanceof Error
      ? { ...x, _tag: 'S3Error', _Params: params }
      : { ...new Error(String(x)), _tag: 'S3Error', _Params: params };
  };

// --------------------------------------------------------------------------
// Wrapper
export function FabricateCommandEffect<I extends s3Client.ServiceInputTypes, O extends s3Client.ServiceOutputTypes>(
  cmdCtor: new (
    params: I
  ) => Command<
    s3Client.ServiceInputTypes,
    I,
    s3Client.ServiceOutputTypes,
    O,
    SmithyResolvedConfiguration<HttpHandlerOptions>
  >
): (params: I, options?: HttpHandlerOptions | undefined) => P.Effect.Effect<S3ClientDeps, Error, O & S3EchoParams<I>> {
  return function (params, options) {
    return P.pipe(
      S3ClientDeps,
      P.Effect.flatMap((deps) =>
        P.Effect.tryPromise({
          try: async () => {
            const cmd = new cmdCtor(params);
            const result = await deps.s3Client.send(cmd, options);
            return { ...result, _Params: params };
          },
          catch: toS3Error(params),
        })
      )
    );
  };
}

// --------------------------------------------------------------------------
// GetCommand
export const GetObjectCommandEffect = FabricateCommandEffect<
  s3Client.GetObjectCommandInput,
  s3Client.GetObjectCommandOutput
>(s3Client.GetObjectCommand);

// --------------------------------------------------------------------------
// PutObjectCommand
export const PutObjectCommandEffect = FabricateCommandEffect<
  s3Client.PutObjectCommandInput,
  s3Client.PutObjectCommandOutput
>(s3Client.PutObjectCommand);

// --------------------------------------------------------------------------
// HeadObjectCommand
export const HeadObjectCommandEffect = FabricateCommandEffect<
  s3Client.HeadObjectCommandInput,
  s3Client.HeadObjectCommandOutput
>(s3Client.HeadObjectCommand);

// --------------------------------------------------------------------------
// DeleteObjectCommand
export const DeleteObjectCommandEffect = FabricateCommandEffect<
  s3Client.DeleteObjectCommandInput,
  s3Client.DeleteObjectCommandOutput
>(s3Client.DeleteObjectCommand);

// --------------------------------------------------------------------------
// ListObjectsV2Command
export const ListObjectsV2CommandEffect = FabricateCommandEffect<
  s3Client.ListObjectsV2CommandInput,
  s3Client.ListObjectsV2CommandOutput
>(s3Client.ListObjectsV2Command);

// --------------------------------------------------------------------------
// Manual
export function GetSignedUrlEffect(
  params: s3Client.GetObjectCommandInput,
  options?: RequestPresigningArguments
): P.Effect.Effect<S3ClientDeps, S3Error, { readonly result: string } & S3EchoParams<s3Client.GetObjectCommandInput>> {
  return P.pipe(
    S3ClientDeps,
    P.Effect.flatMap((deps) =>
      P.Effect.tryPromise({
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
): P.Effect.Effect<S3ClientDeps, S3Error, void> {
  return P.pipe(
    S3ClientDeps,
    P.Effect.flatMap((deps) =>
      P.Effect.tryPromise({
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
): P.Effect.Effect<S3ClientDeps, S3Error, PromiseDependentWritableStream> {
  return P.pipe(
    S3ClientDeps,
    P.Effect.flatMap((deps) =>
      P.Effect.tryPromise({
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

// --------------------------------------------------------------------------
// Utils
export function s3ObjectIsReadable(resp: unknown): resp is { readonly Body: Readable } {
  return !!resp && typeof resp === 'object' && 'Body' in resp && resp.Body instanceof Readable;
}
