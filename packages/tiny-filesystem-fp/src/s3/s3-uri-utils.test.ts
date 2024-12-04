/* eslint-disable fp/no-let */
import * as P from '@konker.dev/effect-ts-prelude';

import { FileType } from '../index';
import type { S3UrlData } from './s3-uri-utils';
import * as s3UriUtils from './s3-uri-utils';

describe('S3 URI Utils', () => {
  describe('helpers', () => {
    it('should trimSlash', () => {
      expect(s3UriUtils.trimSlash('/foo/bar')).toBe('/foo/bar');
      expect(s3UriUtils.trimSlash('/foo/bar/')).toBe('/foo/bar');
      expect(s3UriUtils.trimSlash('/')).toBe('');
    });
  });

  describe('s3UrlDataIsDirectory', () => {
    it('should function correctly', () => {
      expect(
        s3UriUtils.s3UrlDataIsDirectory({
          Bucket: 'foo',
          Path: 'bar/',
          Type: FileType.Directory,
          FullPath: 'bar/',
        } as S3UrlData)
      ).toBe(true);
      expect(
        s3UriUtils.s3UrlDataIsDirectory({
          Bucket: 'foo',
          Path: 'bar/',
          Type: FileType.File,
          FullPath: 'bar/',
        } as S3UrlData)
      ).toBe(false);
    });
  });

  describe('s3UrlDataIsFile', () => {
    it('should function correctly', () => {
      expect(
        s3UriUtils.s3UrlDataIsFile({
          Bucket: 'foo',
          Path: 'bar/',
          Type: FileType.Directory,
          FullPath: 'bar/',
        } as S3UrlData)
      ).toBe(false);
      expect(
        s3UriUtils.s3UrlDataIsFile({
          Bucket: 'foo',
          Path: 'bar/',
          Type: FileType.File,
          FullPath: 'bar/',
        } as S3UrlData)
      ).toBe(true);
    });
  });

  describe('s3Escape', () => {
    it('should work as expected', () => {
      expect(s3UriUtils.s3Escape('folder with space/JPEG image+pl%us.jpeg')).toStrictEqual(
        'folder+with+space/JPEG+image%2Bpl%25us.jpeg'
      );
    });
  });

  describe('s3Unescape', () => {
    it('should work as expected', () => {
      expect(s3UriUtils.s3Unescape('folder+with+space/JPEG+image%2Bpl%25us.jpeg')).toStrictEqual(
        'folder with space/JPEG image+pl%us.jpeg'
      );
    });
  });

  describe('isS3File', () => {
    it('should function correctly', () => {
      expect(s3UriUtils.isS3File('s3://foo/bar')).toBe(false);
      expect(s3UriUtils.isS3File('s3://foo/bar/')).toBe(false);
      expect(s3UriUtils.isS3File('s3://foo/bar/baz.txt')).toBe(true);
      expect(s3UriUtils.isS3File('s3://foo/bar/baz.csv.json.txt')).toBe(true);
    });
  });

  describe('createS3Url', () => {
    it('should function correctly', () => {
      expect(s3UriUtils.createS3Url('foobucket', 'qux.csv')).toBe('s3://foobucket/qux.csv');
      expect(s3UriUtils.createS3Url('foobucket', 'qux+space.csv')).toBe('s3://foobucket/qux%2Bspace.csv');
      expect(s3UriUtils.createS3Url('foobucket', '/bar/baz', 'qux.csv')).toBe('s3://foobucket/bar/baz/qux.csv');
      expect(s3UriUtils.createS3Url('foobucket', '/bar/baz/', 'qux.csv')).toBe('s3://foobucket/bar/baz/qux.csv');
      expect(s3UriUtils.createS3Url('foobucket', '/', 'qux.csv')).toBe('s3://foobucket/qux.csv');
      expect(s3UriUtils.createS3Url('foobucket')).toBe('s3://foobucket/');
      expect(s3UriUtils.createS3Url('foobucket', '/')).toBe('s3://foobucket/');
      expect(s3UriUtils.createS3Url('foobucket', '/bar/baz')).toBe('s3://foobucket/bar/baz');
      expect(s3UriUtils.createS3Url('foobucket', '', 'bar/baz/qux.csv')).toBe('s3://foobucket/bar/baz/qux.csv');
    });
  });

  describe('isS3Url', () => {
    it('should function correctly', () => {
      expect(s3UriUtils.isS3Url('s3://foobucket/bar/baz/qux.csv')).toBe(true);
      expect(s3UriUtils.isS3Url('s3://foobucket/bar/baz/')).toBe(true);
      expect(s3UriUtils.isS3Url('s3://foobucket/bar/baz')).toBe(true);
      expect(s3UriUtils.isS3Url('s3://foobucket/bar/')).toBe(true);
      expect(s3UriUtils.isS3Url('s3://foobucket/')).toBe(true);
      expect(s3UriUtils.isS3Url('s3://foobucket')).toBe(true);
    });

    it('should fail correctly', () => {
      expect(s3UriUtils.isS3Url('http://foobucket/bar/baz/qux.csv')).toBe(false);
      expect(s3UriUtils.isS3Url('bar/baz/qux.csv')).toBe(false);
      expect(s3UriUtils.isS3Url('s3://FooBucket/bar/baz/qux.csv')).toBe(false);
      expect(s3UriUtils.isS3Url('s3://')).toBe(false);
    });
  });

  describe('parseS3Url', () => {
    it('should function correctly', async () => {
      await expect(P.Effect.runPromise(s3UriUtils.parseS3Url('s3://foobucket/bar/baz/qux.csv'))).resolves.toStrictEqual(
        {
          Bucket: 'foobucket',
          Path: 'bar/baz/',
          File: 'qux.csv',
          Type: FileType.File,
          FullPath: 'bar/baz/qux.csv',
        }
      );
      await expect(
        P.Effect.runPromise(s3UriUtils.parseS3Url('s3://foobucket/bar/baz/qux+space.csv'))
      ).resolves.toStrictEqual({
        Bucket: 'foobucket',
        Path: 'bar/baz/',
        File: 'qux space.csv',
        Type: FileType.File,
        FullPath: 'bar/baz/qux space.csv',
      });
      await expect(
        P.Effect.runPromise(s3UriUtils.parseS3Url('s3://foobucket/bar/baz/qux%2Bspace.csv'))
      ).resolves.toStrictEqual({
        Bucket: 'foobucket',
        Path: 'bar/baz/',
        File: 'qux+space.csv',
        Type: FileType.File,
        FullPath: 'bar/baz/qux+space.csv',
      });
      await expect(P.Effect.runPromise(s3UriUtils.parseS3Url('s3://foobucket/bar/baz/'))).resolves.toStrictEqual({
        Bucket: 'foobucket',
        Path: 'bar/baz/',
        File: undefined,
        Type: FileType.Directory,
        FullPath: 'bar/baz/',
      });
      await expect(P.Effect.runPromise(s3UriUtils.parseS3Url('s3://foobucket/bar/baz'))).resolves.toStrictEqual({
        Bucket: 'foobucket',
        Path: 'bar/baz/',
        File: undefined,
        Type: FileType.Directory,
        FullPath: 'bar/baz/',
      });
      await expect(P.Effect.runPromise(s3UriUtils.parseS3Url('s3://foobucket/bar/'))).resolves.toStrictEqual({
        Bucket: 'foobucket',
        Path: 'bar/',
        File: undefined,
        Type: FileType.Directory,
        FullPath: 'bar/',
      });
      await expect(P.Effect.runPromise(s3UriUtils.parseS3Url('s3://foobucket/'))).resolves.toStrictEqual({
        Bucket: 'foobucket',
        Path: '',
        File: undefined,
        Type: FileType.Directory,
        FullPath: '',
      });
      await expect(P.Effect.runPromise(s3UriUtils.parseS3Url('s3://foobucket'))).resolves.toStrictEqual({
        Bucket: 'foobucket',
        Path: '',
        File: undefined,
        Type: FileType.Directory,
        FullPath: '',
      });
    });

    it('should fail correctly', async () => {
      await expect(() =>
        P.Effect.runPromise(s3UriUtils.parseS3Url('http://foobucket/bar/baz/qux.csv'))
      ).rejects.toThrow('[s3-uri-utils] Incorrect protocol');
      await expect(() => P.Effect.runPromise(s3UriUtils.parseS3Url('s3://FooBucket/bar/baz/qux.csv'))).rejects.toThrow(
        's3-uri-utils] S3 URLs must have a lower case bucket component'
      );
      await expect(() => P.Effect.runPromise(s3UriUtils.parseS3Url('s3://'))).rejects.toThrow(
        '[s3-uri-utils] Could not determine bucket name'
      );
      await expect(() => P.Effect.runPromise(s3UriUtils.parseS3Url(''))).rejects.toThrow('ERR_INVALID_URL');
    });
  });
});
