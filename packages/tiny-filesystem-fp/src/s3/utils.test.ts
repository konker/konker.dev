import type * as s3Client from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';
import * as awsStorage from '@aws-sdk/lib-storage';
import { PromiseDependentWritableStream } from '@konker.dev/tiny-utils-fp/stream/PromiseDependentWritableStream';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { Readable } from 'stream';
import { describe, expect, it, vi } from 'vitest';

import * as unit from './utils.js';

// https://stackoverflow.com/a/72885576/203284
// https://github.com/vitest-dev/vitest/issues/6099
vi.mock('@aws-sdk/lib-storage', { spy: true });

describe('s3/utils', () => {
  describe('s3ObjectIsReadable', () => {
    it('returns true for valid S3 object response', () => {
      const mockBody = new Readable();
      const resp = {
        Body: mockBody,
      };
      expect(unit.s3ObjectIsReadable(resp)).toBe(true);
    });

    it('returns false for non-object response', () => {
      expect(unit.s3ObjectIsReadable('string')).toBe(false);
    });

    it('returns false if Body is not readable stream', () => {
      const resp = {
        Body: {},
      };
      expect(unit.s3ObjectIsReadable(resp)).toBe(false);
    });

    it('returns false for no response', () => {
      expect(unit.s3ObjectIsReadable(null)).toBe(false);
      expect(unit.s3ObjectIsReadable(undefined)).toBe(false);
    });
  });

  describe('UploadObjectEffect', () => {
    it('should work as expected with Buffer input', async () => {
      const s3ClientInst = new S3Client({});
      const mockUpload = { done: vi.fn() } as any;
      const uploadSpy = vi.spyOn(awsStorage, 'Upload').mockReturnValue(mockUpload);
      const params: s3Client.PutObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const data = Buffer.from('test-data');
      const command = pipe(unit.UploadObjectEffect(s3ClientInst, params, data));
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
      const s3ClientInst = new S3Client({});
      const mockUpload = { done: vi.fn() } as any;
      const uploadSpy = vi.spyOn(awsStorage, 'Upload').mockReturnValue(mockUpload);
      const params: s3Client.PutObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const data = 'test-data';
      const command = pipe(unit.UploadObjectEffect(s3ClientInst, params, data));
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
      const s3ClientInst = new S3Client({});
      const mockUpload = { done: vi.fn() } as any;
      const uploadSpy = vi.spyOn(awsStorage, 'Upload').mockReturnValue(mockUpload);
      const params: s3Client.PutObjectCommandInput = { Bucket: 'test-bucket', Key: 'test-key' };
      const command = pipe(unit.UploadObjectWriteStreamEffect(s3ClientInst, params));
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
