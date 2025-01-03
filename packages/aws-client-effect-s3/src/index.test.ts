import type {
  DeleteObjectCommandInput,
  GetObjectCommandInput,
  HeadObjectCommandInput,
  ListObjectsV2CommandInput,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import * as s3Client from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import * as unit from './index.js';
import { S3ClientDeps } from './index.js';
import { TAG } from './lib/error.js';

const s3Mock = mockClient(s3Client.S3Client);

describe('aws-client-effect-s3', () => {
  let deps: unit.S3ClientDeps;

  beforeAll(() => {
    deps = unit.S3ClientDeps.of({
      s3Client: new s3Client.S3Client({}),
    });
  });

  describe('Error tag', () => {
    it('should export as expected', () => {
      expect(unit.S3_ERROR_TAG).toEqual('@konker.dev/aws-client-effect-s3/S3Error');
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultS3ClientFactory', () => {
    it('should work as expected', async () => {
      expect(unit.defaultS3ClientFactory({})).toBeInstanceOf(S3Client);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultS3ClientFactoryDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = pipe(
        unit.S3ClientFactoryDeps,
        Effect.map((deps) => deps.s3ClientFactory),
        unit.defaultS3ClientFactoryDeps
      );
      const actual = Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(Function);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultS3ClientDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = pipe(
        unit.S3ClientDeps,
        Effect.map((deps) => deps.s3Client),
        unit.defaultS3ClientDeps({})
      );
      const actual = Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(S3Client);
    });
  });

  // ------------------------------------------------------------------------
  describe('GetObjectCommand', () => {
    beforeEach(() => {
      s3Mock.reset();
    });

    it('should work as expected', async () => {
      s3Mock.on(s3Client.GetObjectCommand).resolves({ Body: 'Hello, World!' } as any);

      const params: GetObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const expected = { Body: 'Hello, World!', _Params: params };
      const command = pipe(unit.GetObjectCommandEffect(params), Effect.provideService(S3ClientDeps, deps));
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(s3Mock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      s3Mock.on(s3Client.GetObjectCommand).rejects({ $metadata: { httpStatusCode: 404 }, code: 'NotFound' } as any);

      const params: GetObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key-not-found' };
      const command = pipe(unit.GetObjectCommandEffect(params), Effect.provideService(S3ClientDeps, deps));
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(
        JSON.stringify({ _tag: TAG, message: 'NotFound' })
      );
      expect(s3Mock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('PutObjectCommand', () => {
    beforeEach(() => {
      s3Mock.reset();
    });

    it('should work as expected', async () => {
      s3Mock.on(s3Client.PutObjectCommand).resolves({} as any);

      const params: PutObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key', Body: 'test-body' };
      const expected = { _Params: params };
      const command = pipe(unit.PutObjectCommandEffect(params), Effect.provideService(S3ClientDeps, deps));
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(s3Mock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      s3Mock.on(s3Client.PutObjectCommand).rejects({ $metadata: { httpStatusCode: 404 }, code: 'NotFound' } as any);

      const params: PutObjectCommandInput = { Bucket: 'test-bucket-not-found', Key: 'test-key' };
      const command = pipe(unit.PutObjectCommandEffect(params), Effect.provideService(S3ClientDeps, deps));
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(
        JSON.stringify({ _tag: TAG, message: 'NotFound' })
      );
      expect(s3Mock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('HeadObjectCommand', () => {
    beforeEach(() => {
      s3Mock.reset();
    });

    it('should work as expected', async () => {
      s3Mock.on(s3Client.HeadObjectCommand).resolves({ Body: 'Hello, World!' } as any);

      const params: HeadObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const expected = { Body: 'Hello, World!', _Params: params };
      const command = pipe(unit.HeadObjectCommandEffect(params), Effect.provideService(S3ClientDeps, deps));
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(s3Mock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      s3Mock.on(s3Client.HeadObjectCommand).rejects({ $metadata: { httpStatusCode: 404 }, code: 'NotFound' } as any);

      const params: HeadObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key-not-found' };
      const command = pipe(unit.HeadObjectCommandEffect(params), Effect.provideService(S3ClientDeps, deps));
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(
        JSON.stringify({ _tag: TAG, message: 'NotFound' })
      );
      expect(s3Mock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('DeleteObjectCommand', () => {
    beforeEach(() => {
      s3Mock.reset();
    });

    it('should work as expected', async () => {
      s3Mock.on(s3Client.DeleteObjectCommand).resolves({} as any);

      const params: DeleteObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const expected = { _Params: params };
      const command = pipe(unit.DeleteObjectCommandEffect(params), Effect.provideService(S3ClientDeps, deps));
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(s3Mock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      s3Mock.on(s3Client.DeleteObjectCommand).rejects({ $metadata: { httpStatusCode: 404 }, code: 'NotFound' } as any);

      const params: DeleteObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key-not-found' };
      const command = pipe(unit.DeleteObjectCommandEffect(params), Effect.provideService(S3ClientDeps, deps));
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(
        JSON.stringify({ _tag: TAG, message: 'NotFound' })
      );
      expect(s3Mock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('ListObjectsV2Command', () => {
    beforeEach(() => {
      s3Mock.reset();
    });

    it('should work as expected', async () => {
      s3Mock.on(s3Client.ListObjectsV2Command).resolves({ Contents: [] });

      const params: ListObjectsV2CommandInput = { Bucket: 'test-bucket' };
      const expected = { Contents: [], _Params: params };
      const command = pipe(unit.ListObjectsV2CommandEffect(params), Effect.provideService(S3ClientDeps, deps));
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(s3Mock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      s3Mock.on(s3Client.ListObjectsV2Command).rejects({ $metadata: { httpStatusCode: 404 }, code: 'NotFound' } as any);

      const params: ListObjectsV2CommandInput = { Bucket: 'test-bucket-not-found' };
      const command = pipe(unit.ListObjectsV2CommandEffect(params), Effect.provideService(S3ClientDeps, deps));
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(
        JSON.stringify({ _tag: TAG, message: 'NotFound' })
      );
      expect(s3Mock.calls().length).toEqual(1);
    });
  });
});
