import type { S3Client } from '@aws-sdk/client-s3';
import * as s3Client from '@aws-sdk/client-s3';
import type { Command, HttpHandlerOptions } from '@aws-sdk/types';
import * as P from '@konker.dev/effect-ts-prelude';
import type { SmithyResolvedConfiguration } from '@smithy/smithy-client/dist-types';

import type { S3Error } from './lib/error';
import { toS3Error } from './lib/error';
export { TAG as S3_ERROR_TAG } from './lib/error';

//------------------------------------------------------
export type S3ClientFactory = (config: s3Client.S3ClientConfig) => s3Client.S3Client;
export const defaultS3ClientFactory: S3ClientFactory = (config: s3Client.S3ClientConfig) =>
  new s3Client.S3Client(config);

export type S3ClientFactoryDeps = {
  readonly s3ClientFactory: S3ClientFactory;
};
export const S3ClientFactoryDeps = P.Context.GenericTag<S3ClientFactoryDeps>('@s3-client-fp/S3ClientFactoryDeps');

export const defaultS3ClientFactoryDeps = P.Effect.provideService(
  S3ClientFactoryDeps,
  S3ClientFactoryDeps.of({
    s3ClientFactory: defaultS3ClientFactory,
  })
);

//------------------------------------------------------
export type S3ClientDeps = {
  readonly s3Client: S3Client;
};
export const S3ClientDeps = P.Context.GenericTag<S3ClientDeps>('s3-client-fp/S3ClientDeps');

export const defaultS3ClientDeps = (config: s3Client.S3ClientConfig) =>
  P.Effect.provideService(
    S3ClientDeps,
    S3ClientDeps.of({
      s3Client: defaultS3ClientFactory(config),
    })
  );

// --------------------------------------------------------------------------
// Wrapper
export type S3EchoParams<I> = { _Params: I };

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
): (
  params: I,
  options?: HttpHandlerOptions | undefined
) => P.Effect.Effect<O & S3EchoParams<I>, S3Error, S3ClientDeps> {
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
// GetObjectCommand
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
