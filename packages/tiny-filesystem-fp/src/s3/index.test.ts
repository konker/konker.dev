import { Readable } from 'node:stream';

import {
  type DeleteObjectCommandInput,
  type GetObjectCommandInput,
  type HeadObjectCommandInput,
  type ListObjectsV2CommandInput,
  type PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import * as S from '@konker.dev/aws-client-effect-s3';
import { S3ClientFactoryDeps } from '@konker.dev/aws-client-effect-s3';
import * as SE from '@konker.dev/aws-client-effect-s3/extra';
import { toS3Error } from '@konker.dev/aws-client-effect-s3/lib/error';
import { PromiseDependentWritableStream } from '@konker.dev/aws-client-effect-s3/lib/PromiseDependentWritableStream';
import { mockClient } from 'aws-sdk-client-mock';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import readline from 'readline';
import { PassThrough, Writable } from 'stream';
import { beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import type { TinyFileSystem } from '../index.js';
import { FileType } from '../index.js';
import { arrayBufferToString, stringToUint8Array } from '../lib/array.js';
import * as unit from './index.js';

describe('S3TinyFileSystem', () => {
  let s3ListObjectsMock: MockInstance;
  let s3TinyFileSystem: TinyFileSystem;

  beforeAll(async () => {
    mockClient(S3Client);

    s3ListObjectsMock = vi.spyOn(S, 'ListObjectsV2CommandEffect');
    s3ListObjectsMock.mockImplementation((params: ListObjectsV2CommandInput) => {
      if (params.Prefix === 'bar/baz/') {
        return Effect.succeed({
          $metadata: {},
          IsTruncated: false,
          Contents: [{ Key: 'bar/baz/test-file0.txt' }],
        });
      }
      if (params.Prefix === 'bar/') {
        return Effect.succeed({
          $metadata: {},
          IsTruncated: false,
          Contents: [{ Key: 'bar/test-file1.txt' }],
          CommonPrefixes: [{ Prefix: 'bar/baz/' }],
        });
      }
      if (params.Prefix === 'bartruncated/') {
        return Effect.succeed({
          $metadata: {},
          IsTruncated: true,
          Contents: [{ Key: 'bartruncated/test-file2.txt' }],
          CommonPrefixes: [{ Prefix: 'bartruncated/' }],
        });
      }
      return Effect.succeed({
        $metadata: {},
        IsTruncated: false,
        Contents: [],
        CommonPrefixes: [],
      });
    });

    s3TinyFileSystem = await Effect.runPromise(
      pipe(
        unit.S3TinyFileSystem({}),
        Effect.provideService(
          S3ClientFactoryDeps,
          S3ClientFactoryDeps.of({
            s3ClientFactory: (config) => new S3Client(config),
          })
        )
      )
    );
  });

  describe('read streams', () => {
    let s3GetObjectReadStreamMock: MockInstance;
    beforeAll(async () => {
      s3GetObjectReadStreamMock = vi.spyOn(S, 'GetObjectCommandEffect');
      s3GetObjectReadStreamMock.mockImplementation((params: GetObjectCommandInput) => {
        if (params.Key?.includes('exists')) {
          return Effect.succeed({ Body: new PassThrough() });
        }
        if (params.Key?.includes('non-stream')) {
          return Effect.succeed({ Body: 'test-file-data' });
        }
        return Effect.fail(new Error('GeneralError'));
      });
    });

    describe('getFileReadStream', () => {
      beforeEach(() => {
        s3GetObjectReadStreamMock.mockClear();
      });

      it('should function correctly', async () => {
        const result = await Effect.runPromise(s3TinyFileSystem.getFileReadStream('s3://foobucket/bar/exists.txt'));
        expect(s3GetObjectReadStreamMock).toHaveBeenCalledTimes(1);
        expect(result).toBeInstanceOf(Readable);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.getFileReadStream('s3://foobucket/bar/bad.txt'))
        ).rejects.toThrow();
        expect(s3GetObjectReadStreamMock).toHaveBeenCalledTimes(1);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.getFileReadStream('s3://foobucket/bar/non-stream.txt'))
        ).rejects.toThrow();
        expect(s3GetObjectReadStreamMock).toHaveBeenCalledTimes(1);
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.getFileReadStream('s3://foobucket/bar'))).rejects.toThrow();
        expect(s3GetObjectReadStreamMock).toHaveBeenCalledTimes(0);
      });
    });

    describe('getFileLineReadStream', () => {
      beforeEach(() => {
        s3GetObjectReadStreamMock.mockClear();
      });

      it('should function correctly', async () => {
        const result = await Effect.runPromise(s3TinyFileSystem.getFileLineReadStream('s3://foobucket/bar/exists.txt'));
        expect(s3GetObjectReadStreamMock).toHaveBeenCalledTimes(1);
        expect(result).toBeInstanceOf(readline.Interface);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.getFileLineReadStream('s3://foobucket/bar/bad.txt'))
        ).rejects.toThrow();
        expect(s3GetObjectReadStreamMock).toHaveBeenCalledTimes(1);
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.getFileLineReadStream('s3://foobucket/bar'))).rejects.toThrow();
        expect(s3GetObjectReadStreamMock).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('getFileWriteStream', () => {
    let s3GetObjectWriteStreamMock: MockInstance;
    beforeAll(async () => {
      s3GetObjectWriteStreamMock = vi.spyOn(SE, 'UploadObjectWriteStreamEffect');
      s3GetObjectWriteStreamMock.mockImplementation((params: PutObjectCommandInput) => {
        if (params.Key?.includes('exists')) {
          return Effect.succeed(new PromiseDependentWritableStream());
        }
        return Effect.fail(new Error('GeneralError'));
      });
    });
    beforeEach(() => {
      s3GetObjectWriteStreamMock.mockClear();
    });

    it('should function correctly', async () => {
      const result = await Effect.runPromise(s3TinyFileSystem.getFileWriteStream('s3://foobucket/bar/exists.txt'));

      expect(s3GetObjectWriteStreamMock).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Writable);
      expect(result).toBeInstanceOf(PromiseDependentWritableStream);
    });

    it('should fail correctly', async () => {
      await expect(
        Effect.runPromise(s3TinyFileSystem.getFileWriteStream('s3://foobucket/bar/bad.txt'))
      ).rejects.toThrow();
      expect(s3GetObjectWriteStreamMock).toHaveBeenCalledTimes(1);
    });

    it('should fail correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.getFileWriteStream('s3://foobucket/bar'))).rejects.toThrow();
      expect(s3GetObjectWriteStreamMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('listFiles', () => {
    beforeEach(() => {
      s3ListObjectsMock.mockClear();
    });

    it('should function correctly', async () => {
      const result = await Effect.runPromise(s3TinyFileSystem.listFiles('s3://foobucket/bar'));
      expect(s3ListObjectsMock).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual(['s3://foobucket/bar/baz', 's3://foobucket/bar/test-file1.txt']);
    });

    it('should fail correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.listFiles('s3://foobucket/bar/file.csv'))).rejects.toThrow(
        'Cannot list files with a non-directory url'
      );
      expect(s3ListObjectsMock).toHaveBeenCalledTimes(0);
    });

    it('should fail correctly when result is truncated', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.listFiles('s3://foobucket/bartruncated'))).rejects.toThrow(
        'Error: listing is truncated'
      );
      expect(s3ListObjectsMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('exists', () => {
    let s3HeadObjectMock: MockInstance;
    beforeAll(async () => {
      s3HeadObjectMock = vi.spyOn(S, 'HeadObjectCommandEffect');
      s3HeadObjectMock.mockImplementation((params: HeadObjectCommandInput) => {
        if (params.Key?.includes('exists')) {
          return Effect.succeed(true);
        }
        if (params.Key?.includes('does-not-exist')) {
          return Effect.fail(toS3Error(params)({ $metadata: { httpStatusCode: 404 }, code: 'NotFound' }));
        }
        if (params.Key?.includes('no-metadata')) {
          return Effect.fail(toS3Error(params)({ code: 'Boom' }));
        }
        return Effect.fail(toS3Error(params)({ $metadata: { httpStatusCode: 500 }, code: 'GeneralError' }));
      });
    });
    beforeEach(() => {
      s3HeadObjectMock.mockClear();
    });

    it('should function correctly when file exists', async () => {
      const result = await Effect.runPromise(s3TinyFileSystem.exists('s3://foobucket/foo/exists.txt'));
      await expect(result).toEqual(true);
      expect(s3HeadObjectMock).toHaveBeenCalledTimes(1);
    });

    it('should function correctly when files does not exist', async () => {
      await expect(
        Effect.runPromise(s3TinyFileSystem.exists('s3://foobucket/foo/does-not-exist.txt'))
      ).resolves.toEqual(false);
      expect(s3HeadObjectMock).toHaveBeenCalledTimes(1);
    });

    it('should function correctly when metadata is missing', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.exists('s3://foobucket/foo/no-metadata.txt'))).rejects.toThrow();
      expect(s3HeadObjectMock).toHaveBeenCalledTimes(1);
    });

    it('should function correctly when a general error is thrown', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.exists('s3://foobucket/foo/error.txt'))).rejects.toThrow();
      expect(s3HeadObjectMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFileType', () => {
    it('should function correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.getFileType('s3://foobucket/foo/bar.txt'))).resolves.toBe(
        FileType.File
      );
      await expect(Effect.runPromise(s3TinyFileSystem.getFileType('s3://foobucket/foo/bar/baz'))).resolves.toBe(
        FileType.Directory
      );
    });
  });

  describe('readFile', () => {
    let s3GetObjectMock: MockInstance;
    beforeAll(async () => {
      s3GetObjectMock = vi.spyOn(S, 'GetObjectCommandEffect');
      s3GetObjectMock.mockImplementation((params: GetObjectCommandInput) => {
        if (params.Key?.includes('exists')) {
          return Effect.succeed({ Body: Readable.from('test-file-data'), _Params: params });
        }
        if (params.Key?.includes('non-stream')) {
          return Effect.succeed({ Body: 'test-file-data', _Params: params });
        }
        return Effect.fail(toS3Error(Error('GeneralError')));
      });
    });
    beforeEach(() => {
      s3GetObjectMock.mockClear();
    });

    it('should function correctly', async () => {
      const result = await Effect.runPromise(s3TinyFileSystem.readFile('s3://foobucket/bar/exists.txt'));
      expect(s3GetObjectMock).toHaveBeenCalledTimes(1);
      expect(arrayBufferToString(result)).toBe('test-file-data');
    });

    it('should fail correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.readFile('s3://foobucket/bar/bad.txt'))).rejects.toThrow();
      expect(s3GetObjectMock).toHaveBeenCalledTimes(1);
    });

    it('should fail correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.readFile('s3://foobucket/bar/non-stream.txt'))).rejects.toThrow();
      expect(s3GetObjectMock).toHaveBeenCalledTimes(1);
    });

    it('should fail correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.readFile('s3://foobucket/bar'))).rejects.toThrow();
      expect(s3GetObjectMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('write objects', () => {
    let s3PutObjectMock: MockInstance;
    let s3UploadObjectMock: MockInstance;
    beforeAll(async () => {
      s3PutObjectMock = vi.spyOn(S, 'PutObjectCommandEffect');
      s3PutObjectMock.mockImplementation((params: PutObjectCommandInput) => {
        if (params.Key?.includes('error')) {
          return Effect.fail(new Error('GeneralError'));
        }
        return Effect.succeed(Effect.void);
      });
      s3UploadObjectMock = vi.spyOn(SE, 'UploadObjectEffect');
      s3UploadObjectMock.mockImplementation((params: PutObjectCommandInput) => {
        if (params.Key?.includes('error')) {
          return Effect.fail(new Error('GeneralError'));
        }
        return Effect.succeed(Effect.void);
      });
    });

    describe('writeFile', () => {
      beforeEach(() => {
        s3PutObjectMock.mockClear();
        s3UploadObjectMock.mockClear();
      });

      it('should function correctly', async () => {
        await Effect.runPromise(s3TinyFileSystem.writeFile('s3://foobucket/bar/qux.txt', 'wham-bam-thank-you-sam'));
        expect(s3UploadObjectMock).toHaveBeenCalledTimes(1);
        expect(s3UploadObjectMock?.mock?.calls?.[0]?.[0]).toStrictEqual({
          Bucket: 'foobucket',
          Key: 'bar/qux.txt',
        });
        expect(s3UploadObjectMock?.mock?.calls?.[0]?.[1]).toStrictEqual(Buffer.from('wham-bam-thank-you-sam'));
      });

      it('should function correctly', async () => {
        await Effect.runPromise(
          s3TinyFileSystem.writeFile('s3://foobucket/bar/qux.txt', stringToUint8Array('wham-bam-thank-you-sam'))
        );
        expect(s3UploadObjectMock).toHaveBeenCalledTimes(1);
        expect(s3UploadObjectMock?.mock?.calls?.[0]?.[0]).toStrictEqual({
          Bucket: 'foobucket',
          Key: 'bar/qux.txt',
        });
        expect(s3UploadObjectMock?.mock?.calls?.[0]?.[1]).toStrictEqual(Buffer.from('wham-bam-thank-you-sam'));
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.writeFile('s3://foobucket/bar/error.txt', 'wham-bam-thank-you-sam'))
        ).rejects.toThrow();
        expect(s3UploadObjectMock).toHaveBeenCalledTimes(1);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.writeFile('s3://foobucket/bar', 'wham-bam-thank-you-sam'))
        ).rejects.toThrow();
        expect(s3UploadObjectMock).toHaveBeenCalledTimes(0);
      });
    });

    describe('createDirectory', () => {
      beforeEach(() => {
        s3PutObjectMock.mockClear();
      });

      it('should function correctly', async () => {
        await Effect.runPromise(s3TinyFileSystem.createDirectory('s3://foobucket/bar/'));
        expect(s3PutObjectMock).toHaveBeenCalledTimes(1);
        expect(s3PutObjectMock?.mock?.calls?.[0]?.[0]).toStrictEqual({
          Bucket: 'foobucket',
          ContentLength: 0,
          Key: 'bar/',
        });
        expect(s3PutObjectMock?.mock?.calls?.[0]?.[1]).toBeUndefined();
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.createDirectory('s3://foobucket/error'))).rejects.toThrow();
        expect(s3PutObjectMock).toHaveBeenCalledTimes(1);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.createDirectory('s3://foobucket/bar/qux.txt'))
        ).rejects.toThrow();
        expect(s3PutObjectMock).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('delete objects', () => {
    let s3DeleteObjectMock: MockInstance;
    beforeAll(async () => {
      s3DeleteObjectMock = vi.spyOn(S, 'DeleteObjectCommandEffect');
      s3DeleteObjectMock.mockImplementation((params: DeleteObjectCommandInput) => {
        if (params.Key?.includes('error')) {
          return Effect.fail(new Error('GeneralError'));
        }
        return Effect.succeed(Effect.void);
      });
    });

    describe('deleteFile', () => {
      beforeEach(() => {
        s3DeleteObjectMock.mockClear();
      });

      it('should function correctly', async () => {
        await Effect.runPromise(s3TinyFileSystem.deleteFile('s3://foobucket/bar/baz.txt'));

        expect(s3DeleteObjectMock).toHaveBeenCalledTimes(1);
        expect(s3DeleteObjectMock?.mock?.calls?.[0]?.[0]).toStrictEqual({
          Bucket: 'foobucket',
          Key: 'bar/baz.txt',
        });
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.deleteFile('s3://foobucket/error.txt'))).rejects.toThrow();
        expect(s3DeleteObjectMock).toHaveBeenCalledTimes(1);
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.deleteFile('s3://foobucket/bar/'))).rejects.toThrow();
        expect(s3DeleteObjectMock).toHaveBeenCalledTimes(0);
      });
    });

    describe('removeDirectory', () => {
      beforeEach(() => {
        s3ListObjectsMock.mockClear();
        s3DeleteObjectMock.mockClear();
      });

      it('should function correctly', async () => {
        await Effect.runPromise(s3TinyFileSystem.removeDirectory('s3://foobucket/bar'));

        expect(s3ListObjectsMock).toHaveBeenCalledTimes(2);
        expect(s3DeleteObjectMock).toHaveBeenCalledTimes(4);
        expect(s3DeleteObjectMock?.mock?.calls?.[0]?.[0]).toStrictEqual({
          Bucket: 'foobucket',
          Key: 'bar/baz/test-file0.txt',
        });
        expect(s3DeleteObjectMock?.mock?.calls?.[1]?.[0]).toStrictEqual({
          Bucket: 'foobucket',
          Key: 'bar/baz/',
        });
        expect(s3DeleteObjectMock?.mock?.calls?.[2]?.[0]).toStrictEqual({
          Bucket: 'foobucket',
          Key: 'bar/test-file1.txt',
        });
        expect(s3DeleteObjectMock?.mock?.calls?.[3]?.[0]).toStrictEqual({
          Bucket: 'foobucket',
          Key: 'bar/',
        });
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.removeDirectory('s3://foobucket/error'))).rejects.toThrow();
        expect(s3DeleteObjectMock).toHaveBeenCalledTimes(1);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.removeDirectory('s3://foobucket/bar/qux.txt'))
        ).rejects.toThrow();
        expect(s3DeleteObjectMock).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('dirName', () => {
    it('should function correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.dirName('s3://foobucket/wat/bar/baz.json'))).resolves.toBe(
        's3://foobucket/wat/bar/'
      );
      await expect(Effect.runPromise(s3TinyFileSystem.dirName('s3://foobucket/wat/bar/'))).resolves.toBe(
        's3://foobucket/wat/bar/'
      );
    });
  });

  describe('fileName', () => {
    it('should function correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.fileName('s3://foobucket/wat/bar/baz.json'))).resolves.toBe(
        'baz.json'
      );
    });
    it('should function correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.fileName('s3://foobucket/wat/bar/'))).rejects.toThrow(
        'TinyFileSystemError'
      );
    });
  });

  describe('joinPath', () => {
    it('should function correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.joinPath('s3://foobucket/wat', 'bar', 'baz.json'))).resolves.toBe(
        's3://foobucket/wat/bar/baz.json'
      );
      await expect(Effect.runPromise(s3TinyFileSystem.joinPath('foo', 'bar', 'baz.json'))).resolves.toBe(
        'foo/bar/baz.json'
      );
      await expect(Effect.runPromise(s3TinyFileSystem.joinPath('foo/bar', 'baz.json'))).resolves.toBe(
        'foo/bar/baz.json'
      );
      await expect(Effect.runPromise(s3TinyFileSystem.joinPath('/foo', 'baz.json'))).resolves.toBe('/foo/baz.json');
      await expect(Effect.runPromise(s3TinyFileSystem.joinPath('/', 'baz.json'))).resolves.toBe('/baz.json');
      await expect(Effect.runPromise(s3TinyFileSystem.joinPath('', 'baz.json'))).resolves.toBe('baz.json');
      await expect(Effect.runPromise(s3TinyFileSystem.joinPath('', 'bar', 'baz.json'))).resolves.toBe('bar/baz.json');
      await expect(Effect.runPromise(s3TinyFileSystem.joinPath())).resolves.toBe('');
    });
  });

  describe('basename', () => {
    it('should function correctly', () => {
      expect(s3TinyFileSystem.basename('s3://foo/bar/baz.json')).toEqual('baz.json');
      expect(s3TinyFileSystem.basename('s3://foo/bar/baz.json', '.json')).toEqual('baz');
      expect(s3TinyFileSystem.basename('s3://foo/bar')).toEqual('bar');
      expect(s3TinyFileSystem.basename('s3://foo/bar/')).toEqual('bar');
      expect(s3TinyFileSystem.basename('s3://foo/')).toEqual('foo');
      expect(s3TinyFileSystem.basename('s3://foo')).toEqual('foo');
    });
  });

  describe('relative', () => {
    it('should function correctly', async () => {
      expect(s3TinyFileSystem.relative('s3://foo/bar/', 's3://foo/bar/baz/qux.json')).toBe('baz/qux.json');
    });
  });

  describe('extname', () => {
    it('should function correctly', async () => {
      expect(s3TinyFileSystem.extname('s3://foo/bar/baz/qux.json')).toBe('.json');
    });
  });

  describe('isAbsolute', () => {
    it('should work as expected', () => {
      expect(s3TinyFileSystem.isAbsolute('s3://foo/bar/baz/qux.json')).toEqual(true);
      expect(s3TinyFileSystem.isAbsolute('path/to/file.txt')).toEqual(false);
      expect(s3TinyFileSystem.isAbsolute('./path/to/file.txt')).toEqual(false);
    });
  });
});
