import type { GetObjectCommandInput } from '@aws-sdk/client-s3';
import * as s3Client from '@aws-sdk/client-s3';
import * as awsStorage from '@aws-sdk/lib-storage';
import * as s3RequestPresigner from '@aws-sdk/s3-request-presigner';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as unit from './extra.js';
import { S3ClientDeps } from './index.js';
import { PromiseDependentWritableStream } from './lib/PromiseDependentWritableStream.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('@aws-sdk/s3-request-presigner', { spy: true });
vi.mock('@aws-sdk/lib-storage', { spy: true });

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
    vi.restoreAllMocks();
  });

  describe('GetSignedUrlEffect', () => {
    it('should work as expected', async () => {
      vi.spyOn(s3RequestPresigner, 'getSignedUrl').mockResolvedValue('https://signedurl.example.com/');

      const params: GetObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const command = pipe(unit.GetSignedUrlEffect(params), Effect.provideService(S3ClientDeps, deps));
      const actual = await Effect.runPromise(command);
      const expected = { result: 'https://signedurl.example.com/', _Params: params };

      expect(actual).toStrictEqual(expected);
    });
  });

  describe('UploadObjectEffect', () => {
    it('should work as expected with Buffer input', async () => {
      const mockUpload = { done: vi.fn() } as any;
      const uploadSpy = vi.spyOn(awsStorage, 'Upload').mockReturnValue(mockUpload);
      const params: s3Client.PutObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const data = Buffer.from('test-data');
      const command = pipe(unit.UploadObjectEffect(params, data), Effect.provideService(S3ClientDeps, deps));
      await Effect.runPromise(command);

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
      const mockUpload = { done: vi.fn() } as any;
      const uploadSpy = vi.spyOn(awsStorage, 'Upload').mockReturnValue(mockUpload);
      const params: s3Client.PutObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const data = 'test-data';
      const command = pipe(unit.UploadObjectEffect(params, data), Effect.provideService(S3ClientDeps, deps));
      await Effect.runPromise(command);

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
      const mockUpload = { done: vi.fn() } as any;
      const uploadSpy = vi.spyOn(awsStorage, 'Upload').mockReturnValue(mockUpload);
      const params: s3Client.PutObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const command = pipe(unit.UploadObjectWriteStreamEffect(params), Effect.provideService(S3ClientDeps, deps));
      const actual = await Effect.runPromise(command);

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
