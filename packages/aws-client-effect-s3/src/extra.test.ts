/* eslint-disable fp/no-mutation,fp/no-let */
import { describe } from 'node:test';

import type { GetObjectCommandInput } from '@aws-sdk/client-s3';
import * as s3Client from '@aws-sdk/client-s3';
import * as awsStorge from '@aws-sdk/lib-storage';
import * as s3RequestPresigner from '@aws-sdk/s3-request-presigner';
import * as P from '@konker.dev/effect-ts-prelude';

import * as unit from './extra';
import { S3ClientDeps } from './index';
import { PromiseDependentWritableStream } from './lib/PromiseDependentWritableStream';

// https://stackoverflow.com/a/72885576/203284
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  ...jest.requireActual('@aws-sdk/s3-request-presigner'),
}));
jest.mock('@aws-sdk/lib-storage', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  ...jest.requireActual('@aws-sdk/lib-storage'),
}));

describe('aws-client-effect-s3/extra', () => {
  let deps: S3ClientDeps;
  let s3ClientInst: s3Client.S3Client;

  beforeAll(() => {
    s3ClientInst = new s3Client.S3Client({});
    deps = S3ClientDeps.of({
      s3Client: s3ClientInst,
    });
  });
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('GetSignedUrlEffect', () => {
    it('should work as expected', async () => {
      jest.spyOn(s3RequestPresigner, 'getSignedUrl').mockResolvedValue('https://signedurl.example.com/');

      const params: GetObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const command = P.pipe(unit.GetSignedUrlEffect(params), P.Effect.provideService(S3ClientDeps, deps));
      const actual = await P.Effect.runPromise(command);
      const expected = { result: 'https://signedurl.example.com/', _Params: params };

      expect(actual).toStrictEqual(expected);
    });
  });

  describe('UploadObjectEffect', () => {
    it('should work as expected with Buffer input', async () => {
      const mockUpload = { done: jest.fn() } as any;
      const uploadSpy = jest.spyOn(awsStorge, 'Upload').mockReturnValue(mockUpload);
      const params: s3Client.PutObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const data = Buffer.from('test-data');
      const command = P.pipe(unit.UploadObjectEffect(params, data), P.Effect.provideService(S3ClientDeps, deps));
      await P.Effect.runPromise(command);

      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(uploadSpy.mock.calls[0]?.[0]).toStrictEqual({
        client: s3ClientInst,
        leavePartsOnError: false,
        params: {
          Bucket: params.Bucket,
          Key: params.Key,
          Body: data,
          ContentLength: 9,
        },
      });
      expect(mockUpload.done).toHaveBeenCalledTimes(1);
    });

    it('should work as expected with string input', async () => {
      const mockUpload = { done: jest.fn() } as any;
      const uploadSpy = jest.spyOn(awsStorge, 'Upload').mockReturnValue(mockUpload);
      const params: s3Client.PutObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const data = 'test-data';
      const command = P.pipe(unit.UploadObjectEffect(params, data), P.Effect.provideService(S3ClientDeps, deps));
      await P.Effect.runPromise(command);

      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(uploadSpy.mock.calls[0]?.[0]).toStrictEqual({
        client: s3ClientInst,
        leavePartsOnError: false,
        params: {
          Bucket: params.Bucket,
          Key: params.Key,
          Body: Buffer.from(data),
          ContentLength: 9,
        },
      });
      expect(mockUpload.done).toHaveBeenCalledTimes(1);
    });
  });

  describe('UploadObjectWriteStreamEffect', () => {
    it('should work as expected', async () => {
      const mockUpload = { done: jest.fn() } as any;
      const uploadSpy = jest.spyOn(awsStorge, 'Upload').mockReturnValue(mockUpload);
      const params: s3Client.PutObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const command = P.pipe(unit.UploadObjectWriteStreamEffect(params), P.Effect.provideService(S3ClientDeps, deps));
      const actual = await P.Effect.runPromise(command);

      expect(actual).toBeInstanceOf(PromiseDependentWritableStream);
      expect(uploadSpy).toHaveBeenCalledTimes(1);
      expect(uploadSpy.mock.calls[0]?.[0]).toStrictEqual({
        client: s3ClientInst,
        leavePartsOnError: false,
        params: {
          Bucket: params.Bucket,
          Key: params.Key,
          Body: actual,
        },
      });
      expect(mockUpload.done).toHaveBeenCalledTimes(1);
    });
  });
});
