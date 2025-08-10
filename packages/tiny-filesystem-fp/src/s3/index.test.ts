import { Readable } from 'node:stream';

import {
  DeleteObjectCommand,
  type DeleteObjectCommandInput,
  GetObjectCommand,
  type GetObjectCommandInput,
  HeadObjectCommand,
  type HeadObjectCommandInput,
  ListObjectsV2Command,
  type ListObjectsV2CommandInput,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3ClientInstance } from '@effect-aws/client-s3/S3ClientInstance';
import { PromiseDependentWritableStream } from '@konker.dev/tiny-utils-fp/stream/PromiseDependentWritableStream';
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
import * as utils from './utils.js';

describe('S3TinyFileSystem', () => {
  let s3TinyFileSystem: TinyFileSystem;
  const clientMock = mockClient(S3Client);
  const s3Client = new S3Client();

  beforeAll(async () => {
    clientMock.on(ListObjectsV2Command).callsFake(async (params: ListObjectsV2CommandInput) => {
      if (params.Prefix === 'bar/baz/') {
        return {
          $metadata: {},
          IsTruncated: false,
          Contents: [{ Key: 'bar/baz/test-file0.txt' }],
        };
      }
      if (params.Prefix === 'bar/') {
        return {
          $metadata: {},
          IsTruncated: false,
          Contents: [{ Key: 'bar/test-file1.txt' }],
          CommonPrefixes: [{ Prefix: 'bar/baz/' }],
        };
      }
      if (params.Prefix === 'bartruncated/') {
        return {
          $metadata: {},
          IsTruncated: true,
          Contents: [{ Key: 'bartruncated/test-file2.txt' }],
          CommonPrefixes: [{ Prefix: 'bartruncated/' }],
        };
      }
      return {
        $metadata: {},
        IsTruncated: false,
        Contents: [],
        CommonPrefixes: [],
      };
    });
    clientMock.on(GetObjectCommand).callsFake(async (params: GetObjectCommandInput) => {
      if (params.Key?.includes('exists')) {
        return { Body: new PassThrough() };
      }
      if (params.Key?.includes('non-stream')) {
        return { Body: 'test-file-data' };
      }
      throw new Error('GeneralError');
    });
    clientMock.on(HeadObjectCommand).callsFake(async (params: HeadObjectCommandInput) => {
      if (params.Key?.includes('exists')) {
        return {};
      }
      if (params.Key?.includes('does-not-exist')) {
        throw { _tag: 'NotFound', cause: { $metadata: { httpStatusCode: 404 }, code: 'NotFound' } };
      }
      if (params.Key?.includes('no-metadata')) {
        throw { code: 'Boom' };
      }
      throw { $metadata: { httpStatusCode: 500 }, code: 'GeneralError' };
    });
    clientMock.on(PutObjectCommand).callsFake(async (params: PutObjectCommandInput) => {
      if (params.Key?.includes('error')) {
        throw new Error('GeneralError');
      }
      return void 0;
    });

    s3TinyFileSystem = await Effect.runPromise(
      pipe(unit.S3TinyFileSystem(), Effect.provideService(S3ClientInstance, s3Client))
    );
  });

  describe('read streams', () => {
    describe('getFileReadStream', () => {
      beforeEach(() => {
        clientMock.resetHistory();
      });

      it('should function correctly', async () => {
        const result = await Effect.runPromise(s3TinyFileSystem.getFileReadStream('s3://foobucket/bar/exists.txt'));
        expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(result).toBeInstanceOf(Readable);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.getFileReadStream('s3://foobucket/bar/bad.txt'))
        ).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.getFileReadStream('s3://foobucket/bar/non-stream.txt'))
        ).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.getFileReadStream('s3://foobucket/bar'))).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 0);
      });
    });

    describe('getFileLineReadStream', () => {
      beforeEach(() => {
        clientMock.resetHistory();
      });

      it('should function correctly', async () => {
        const result = await Effect.runPromise(s3TinyFileSystem.getFileLineReadStream('s3://foobucket/bar/exists.txt'));
        expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
        expect(result).toBeInstanceOf(readline.Interface);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.getFileLineReadStream('s3://foobucket/bar/bad.txt'))
        ).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.getFileLineReadStream('s3://foobucket/bar'))).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 0);
      });
    });
  });

  describe('getFileWriteStream', () => {
    let s3GetObjectWriteStreamMock: MockInstance;
    beforeAll(async () => {
      s3GetObjectWriteStreamMock = vi.spyOn(utils, 'UploadObjectWriteStreamEffect');
      s3GetObjectWriteStreamMock.mockImplementation((_client: any, params: PutObjectCommandInput) => {
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
      clientMock.resetHistory();
    });

    it('should function correctly', async () => {
      const result = await Effect.runPromise(s3TinyFileSystem.listFiles('s3://foobucket/bar'));
      expect(clientMock).toHaveReceivedCommandTimes(ListObjectsV2Command, 1);
      expect(result).toStrictEqual(['s3://foobucket/bar/baz', 's3://foobucket/bar/test-file1.txt']);
    });

    it('should fail correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.listFiles('s3://foobucket/bar/file.csv'))).rejects.toThrow(
        'Cannot list files with a non-directory url'
      );
      expect(clientMock).toHaveReceivedCommandTimes(ListObjectsV2Command, 0);
    });

    it('should fail correctly when result is truncated', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.listFiles('s3://foobucket/bartruncated'))).rejects.toThrow(
        'Error: listing is truncated'
      );
      expect(clientMock).toHaveReceivedCommandTimes(ListObjectsV2Command, 1);
    });
  });

  describe('exists', () => {
    beforeEach(() => {
      clientMock.resetHistory();
    });

    it('should function correctly when file exists', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.exists('s3://foobucket/foo/exists.txt'))).resolves.toEqual(true);
      expect(clientMock).toHaveReceivedCommandTimes(HeadObjectCommand, 1);
    });

    it.skip('should function correctly when files does not exist', async () => {
      await expect(
        Effect.runPromise(s3TinyFileSystem.exists('s3://foobucket/foo/does-not-exist.txt'))
      ).resolves.toEqual(false);
      expect(clientMock).toHaveReceivedCommandTimes(HeadObjectCommand, 1);
    });

    it('should function correctly when metadata is missing', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.exists('s3://foobucket/foo/no-metadata.txt'))).rejects.toThrow();
      expect(clientMock).toHaveReceivedCommandTimes(HeadObjectCommand, 1);
    });

    it('should function correctly when a general error is thrown', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.exists('s3://foobucket/foo/error.txt'))).rejects.toThrow();
      expect(clientMock).toHaveReceivedCommandTimes(HeadObjectCommand, 1);
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
    beforeAll(async () => {
      clientMock.on(GetObjectCommand).callsFake(async (params: GetObjectCommandInput) => {
        if (params.Key?.includes('exists')) {
          return { Body: Readable.from('test-file-data'), _Params: params };
        }
        if (params.Key?.includes('non-stream')) {
          return { Body: 'test-file-data', _Params: params };
        }
        throw Error('GeneralError');
      });
    });
    beforeEach(() => {
      clientMock.resetHistory();
    });

    it('should function correctly', async () => {
      const result = await Effect.runPromise(s3TinyFileSystem.readFile('s3://foobucket/bar/exists.txt'));
      expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
      expect(arrayBufferToString(result)).toBe('test-file-data');
    });

    it('should fail correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.readFile('s3://foobucket/bar/bad.txt'))).rejects.toThrow();
      expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
    });

    it('should fail correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.readFile('s3://foobucket/bar/non-stream.txt'))).rejects.toThrow();
      expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 1);
    });

    it('should fail correctly', async () => {
      await expect(Effect.runPromise(s3TinyFileSystem.readFile('s3://foobucket/bar'))).rejects.toThrow();
      expect(clientMock).toHaveReceivedCommandTimes(GetObjectCommand, 0);
    });
  });

  describe('write objects', () => {
    let s3UploadObjectMock: MockInstance;
    beforeAll(async () => {
      s3UploadObjectMock = vi.spyOn(utils, 'UploadObjectEffect');
      s3UploadObjectMock.mockImplementation((_client: any, params: PutObjectCommandInput) => {
        if (params.Key?.includes('error')) {
          return Effect.fail(new Error('GeneralError'));
        }
        return Effect.succeed(Effect.void);
      });
    });

    describe('writeFile', () => {
      beforeEach(() => {
        clientMock.resetHistory();
        s3UploadObjectMock.mockClear();
      });

      it('should function correctly with string input', async () => {
        await Effect.runPromise(s3TinyFileSystem.writeFile('s3://foobucket/bar/qux.txt', 'wham-bam-thank-you-sam'));
        expect(s3UploadObjectMock).toHaveBeenCalledTimes(1);
        expect(s3UploadObjectMock?.mock?.calls?.[0]?.[1]).toStrictEqual({
          Bucket: 'foobucket',
          Key: 'bar/qux.txt',
        });
        expect(s3UploadObjectMock?.mock?.calls?.[0]?.[2]).toStrictEqual(Buffer.from('wham-bam-thank-you-sam'));
      });

      it('should function correctly with Uint8Array input', async () => {
        await Effect.runPromise(
          s3TinyFileSystem.writeFile('s3://foobucket/bar/qux.txt', stringToUint8Array('wham-bam-thank-you-sam'))
        );
        expect(s3UploadObjectMock).toHaveBeenCalledTimes(1);
        expect(s3UploadObjectMock?.mock?.calls?.[0]?.[1]).toStrictEqual({
          Bucket: 'foobucket',
          Key: 'bar/qux.txt',
        });
        expect(s3UploadObjectMock?.mock?.calls?.[0]?.[2]).toStrictEqual(Buffer.from('wham-bam-thank-you-sam'));
      });

      it('should function correctly with ArrayBuffer input', async () => {
        await Effect.runPromise(
          s3TinyFileSystem.writeFile(
            's3://foobucket/bar/qux.txt',
            stringToUint8Array('wham-bam-thank-you-sam').buffer as ArrayBuffer
          )
        );
        expect(s3UploadObjectMock).toHaveBeenCalledTimes(1);
        expect(s3UploadObjectMock?.mock?.calls?.[0]?.[1]).toStrictEqual({
          Bucket: 'foobucket',
          Key: 'bar/qux.txt',
        });
        expect(s3UploadObjectMock?.mock?.calls?.[0]?.[2]).toStrictEqual(Buffer.from('wham-bam-thank-you-sam'));
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
        clientMock.resetHistory();
      });

      it('should function correctly', async () => {
        await Effect.runPromise(s3TinyFileSystem.createDirectory('s3://foobucket/bar/'));
        expect(clientMock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
        expect(clientMock).toHaveReceivedCommandWith(PutObjectCommand, {
          Bucket: 'foobucket',
          ContentLength: 0,
          Key: 'bar/',
        });
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.createDirectory('s3://foobucket/error'))).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(PutObjectCommand, 1);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.createDirectory('s3://foobucket/bar/qux.txt'))
        ).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(PutObjectCommand, 0);
      });
    });
  });

  describe('delete objects', () => {
    beforeAll(async () => {
      clientMock.on(DeleteObjectCommand).callsFake(async (params: DeleteObjectCommandInput) => {
        if (params.Key?.includes('error')) {
          throw new Error('GeneralError');
        }
        return void 0;
      });
    });

    describe('deleteFile', () => {
      beforeEach(() => {
        clientMock.resetHistory();
      });

      it('should function correctly', async () => {
        await Effect.runPromise(s3TinyFileSystem.deleteFile('s3://foobucket/bar/baz.txt'));

        expect(clientMock).toHaveReceivedCommandTimes(DeleteObjectCommand, 1);
        expect(clientMock).toHaveReceivedNthCommandWith(DeleteObjectCommand, 1, {
          Bucket: 'foobucket',
          Key: 'bar/baz.txt',
        });
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.deleteFile('s3://foobucket/error.txt'))).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(DeleteObjectCommand, 1);
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.deleteFile('s3://foobucket/bar/'))).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(DeleteObjectCommand, 0);
      });
    });

    describe('removeDirectory', () => {
      beforeEach(() => {
        clientMock.resetHistory();
      });

      it('should function correctly', async () => {
        await Effect.runPromise(s3TinyFileSystem.removeDirectory('s3://foobucket/bar'));

        expect(clientMock).toHaveReceivedCommandTimes(ListObjectsV2Command, 2);
        expect(clientMock).toHaveReceivedCommandTimes(DeleteObjectCommand, 4);
        expect(clientMock).toHaveReceivedNthCommandWith(DeleteObjectCommand, 1, {
          Bucket: 'foobucket',
          Key: 'bar/baz/test-file0.txt',
        });
        expect(clientMock).toHaveReceivedNthCommandWith(DeleteObjectCommand, 2, {
          Bucket: 'foobucket',
          Key: 'bar/baz/',
        });
        expect(clientMock).toHaveReceivedNthCommandWith(DeleteObjectCommand, 3, {
          Bucket: 'foobucket',
          Key: 'bar/test-file1.txt',
        });
        expect(clientMock).toHaveReceivedNthCommandWith(DeleteObjectCommand, 4, {
          Bucket: 'foobucket',
          Key: 'bar/',
        });
      });

      it('should fail correctly', async () => {
        await expect(Effect.runPromise(s3TinyFileSystem.removeDirectory('s3://foobucket/error'))).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(DeleteObjectCommand, 1);
      });

      it('should fail correctly', async () => {
        await expect(
          Effect.runPromise(s3TinyFileSystem.removeDirectory('s3://foobucket/bar/qux.txt'))
        ).rejects.toThrow();
        expect(clientMock).toHaveReceivedCommandTimes(DeleteObjectCommand, 0);
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
