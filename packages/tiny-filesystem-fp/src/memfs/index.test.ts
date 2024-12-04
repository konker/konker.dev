/* eslint-disable fp/no-let,fp/no-mutation */
import * as P from '@konker.dev/effect-ts-prelude';
import { fs } from 'memfs';
import readline from 'readline';
import { PassThrough, Readable, Writable } from 'stream';

import type { DirectoryPath } from '../index';
import { FileType } from '../index';
import { arrayBufferToString, stringToUint8Array } from '../lib/array';
import * as memFs1Fixture from '../test/fixtures/memfs-1.json';
import * as unit from './index';

describe('MemFsTinyFileSystem', () => {
  let memFsTinyFileSystem: unit.MemFsTinyFileSystem;

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    memFsTinyFileSystem = unit.MemFsTinyFileSystem(memFs1Fixture, '/tmp');
  });

  describe('default init params', () => {
    it('should work as expected', () => {
      const actual = unit.MemFsTinyFileSystem();
      expect(actual).toBeDefined();
    });
  });

  describe('getFileReadStream', () => {
    let stub1: jest.SpyInstance;
    beforeEach(() => {
      stub1 = jest.spyOn(fs, 'createReadStream').mockReturnValue(new Readable() as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const data = await P.Effect.runPromise(memFsTinyFileSystem.getFileReadStream('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0][0]).toBe('/foo/bar.txt');
      expect(data).toBeInstanceOf(Readable);
    });
  });

  describe('getFileLineReadStream', () => {
    let stub1: jest.SpyInstance;
    beforeEach(() => {
      stub1 = jest.spyOn(fs, 'createReadStream').mockReturnValue(new PassThrough() as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const data = await P.Effect.runPromise(memFsTinyFileSystem.getFileLineReadStream('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0][0]).toBe('/foo/bar.txt');
      expect(data).toBeInstanceOf(readline.Interface);
    });
  });

  describe('getFileWriteStream', () => {
    let stub1: jest.SpyInstance;
    beforeEach(() => {
      stub1 = jest.spyOn(fs, 'createWriteStream').mockReturnValue(new PassThrough() as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const data = await P.Effect.runPromise(memFsTinyFileSystem.getFileWriteStream('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0][0]).toBe('/foo/bar.txt');
      expect(stub1.mock.calls[0][1]).toStrictEqual({ flags: 'w' });
      expect(data).toBeInstanceOf(Writable);
    });
  });

  describe('getFileAppendWriteStream', () => {
    let stub1: jest.SpyInstance;
    beforeEach(() => {
      stub1 = jest.spyOn(fs, 'createWriteStream').mockReturnValue(new PassThrough() as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const data = await P.Effect.runPromise(memFsTinyFileSystem.getFileAppendWriteStream('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0][0]).toBe('/foo/bar.txt');
      expect(stub1.mock.calls[0][1]).toStrictEqual({ flags: 'a' });
      expect(data).toBeInstanceOf(Writable);
    });
  });

  describe('listFiles', () => {
    let stub1: jest.SpyInstance;
    beforeEach(() => {
      stub1 = jest.spyOn(fs.promises, 'readdir').mockReturnValue(['test-file.txt'] as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const files = await P.Effect.runPromise(memFsTinyFileSystem.listFiles('./foo/bar'));
      expect(stub1).toHaveBeenCalledTimes(1);
      expect(files[0]).toBe('foo/bar/test-file.txt');
    });

    it('should function correctly', async () => {
      const files = await P.Effect.runPromise(memFsTinyFileSystem.listFiles('foo/bar'));
      expect(stub1).toHaveBeenCalledTimes(1);
      expect(files[0]).toBe('foo/bar/test-file.txt');
    });

    it('should function correctly', async () => {
      const files = await P.Effect.runPromise(memFsTinyFileSystem.listFiles('/foo/bar'));
      expect(stub1).toHaveBeenCalledTimes(1);
      expect(files[0]).toBe('/foo/bar/test-file.txt');
    });
  });

  describe('glob', () => {
    it('should function correctly', async () => {
      const files = await P.Effect.runPromise(memFsTinyFileSystem.glob('/tmp/**/*.txt'));
      expect(files).toStrictEqual(['/tmp/foo/a.txt', '/tmp/foo/b.txt', '/tmp/foo/bar/e.txt']);
    });

    it('should function correctly', async () => {
      const files = await P.Effect.runPromise(memFsTinyFileSystem.glob('/tmp/**/*'));
      expect(files).toStrictEqual([
        '/tmp/foo/a.txt',
        '/tmp/foo/b.txt',
        '/tmp/foo/c.csv',
        '/tmp/foo/d.json',
        '/tmp/foo/bar/e.txt',
        '/tmp/foo/bar/f.log',
      ]);
    });

    it('should function correctly', async () => {
      const files = await P.Effect.runPromise(memFsTinyFileSystem.glob('/tmp/foo/*.txt'));
      expect(files).toStrictEqual(['/tmp/foo/a.txt', '/tmp/foo/b.txt']);
    });
  });

  describe('exists', () => {
    let stub1: jest.SpyInstance;
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      stub1 = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const data = await P.Effect.runPromise(memFsTinyFileSystem.exists('./foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(data).toBe(true);
    });

    it('should function correctly', async () => {
      stub1 = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const data = await P.Effect.runPromise(memFsTinyFileSystem.exists('./foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(data).toBe(false);
    });
  });

  describe('getFileType', () => {
    let stub1: jest.SpyInstance;
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      stub1 = jest.spyOn(fs.promises, 'lstat').mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);
      const data = await P.Effect.runPromise(memFsTinyFileSystem.getFileType('./foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(data).toBe(FileType.File);
    });

    it('should function correctly', async () => {
      stub1 = jest.spyOn(fs.promises, 'lstat').mockReturnValue({ isFile: () => false, isDirectory: () => true } as any);
      const data = await P.Effect.runPromise(memFsTinyFileSystem.getFileType('./foo'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(data).toBe(FileType.Directory);
    });

    it('should function correctly', async () => {
      stub1 = jest
        .spyOn(fs.promises, 'lstat')
        .mockReturnValue({ isFile: () => false, isDirectory: () => false } as any);
      const data = await P.Effect.runPromise(memFsTinyFileSystem.getFileType('.'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(data).toBe(FileType.Other);
    });
  });

  describe('createDirectory', () => {
    let stub1: jest.SpyInstance;
    let stub2: jest.SpyInstance;
    beforeEach(() => {
      stub2 = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue('ok');
    });
    afterEach(() => {
      stub1.mockClear();
      stub2.mockClear();
    });

    it('should function correctly, directory does not exist', async () => {
      stub1 = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      await P.Effect.runPromise(memFsTinyFileSystem.createDirectory('/foo/baz' as DirectoryPath));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub2).toHaveBeenCalledTimes(1);
      expect(stub2.mock.calls[0][0]).toBe('/foo/baz');
    });

    it('should function correctly, directory exists', async () => {
      stub1 = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      await P.Effect.runPromise(memFsTinyFileSystem.createDirectory('/foo/baz' as DirectoryPath));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub2).toHaveBeenCalledTimes(0);
    });
  });

  describe('removeDirectory', () => {
    let stub1: jest.SpyInstance;
    let stub2: jest.SpyInstance;
    beforeEach(() => {
      stub2 = jest.spyOn(fs.promises, 'rm').mockResolvedValue();
    });
    afterEach(() => {
      stub1.mockClear();
      stub2.mockClear();
    });

    it('should function correctly, directory does not exist', async () => {
      stub1 = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      await P.Effect.runPromise(memFsTinyFileSystem.removeDirectory('/foo/baz' as DirectoryPath));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub2).toHaveBeenCalledTimes(0);
    });

    it('should function correctly, directory exists', async () => {
      stub1 = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      await P.Effect.runPromise(memFsTinyFileSystem.removeDirectory('/foo/baz' as DirectoryPath));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub2).toHaveBeenCalledTimes(1);
      expect(stub2.mock.calls[0][0]).toBe('/foo/baz');
    });
  });

  describe('readFile', () => {
    let stub1: jest.SpyInstance;
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      stub1 = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('some test text'));
      const data = await P.Effect.runPromise(memFsTinyFileSystem.readFile('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0][0]).toBe('/foo/bar.txt');
      expect(arrayBufferToString(data)).toBe('some test text');
    });

    it('should function correctly', async () => {
      stub1 = jest.spyOn(fs.promises, 'readFile').mockResolvedValue('some test text');
      const data = await P.Effect.runPromise(memFsTinyFileSystem.readFile('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0][0]).toBe('/foo/bar.txt');
      expect(arrayBufferToString(data)).toBe('some test text');
    });
  });

  describe('writeFile', () => {
    let stub1: jest.SpyInstance;
    beforeEach(() => {
      stub1 = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      await P.Effect.runPromise(memFsTinyFileSystem.writeFile('/foo/bar.txt', 'some test text'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0][0]).toBe('/foo/bar.txt');
      expect(stub1.mock.calls[0][1]).toStrictEqual('some test text');
    });

    it('should function correctly', async () => {
      await P.Effect.runPromise(memFsTinyFileSystem.writeFile('/foo/bar.txt', stringToUint8Array('some test text')));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0][0]).toBe('/foo/bar.txt');
      expect(stub1.mock.calls[0][1]).toStrictEqual(Buffer.from(stringToUint8Array('some test text')));
    });
  });

  describe('deleteFile', () => {
    let stub1: jest.SpyInstance;
    beforeEach(() => {
      stub1 = jest.spyOn(fs.promises, 'unlink').mockResolvedValue();
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      await P.Effect.runPromise(memFsTinyFileSystem.deleteFile('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0][0]).toBe('/foo/bar.txt');
    });
  });

  describe('joinPath', () => {
    it('should function correctly', async () => {
      expect(P.Effect.runSync(memFsTinyFileSystem.joinPath('foo', 'bar', 'baz.json'))).toEqual('foo/bar/baz.json');
      expect(P.Effect.runSync(memFsTinyFileSystem.joinPath('foo/bar', 'baz.json'))).toEqual('foo/bar/baz.json');
      expect(P.Effect.runSync(memFsTinyFileSystem.joinPath('/foo', 'baz.json'))).toEqual('/foo/baz.json');
      expect(P.Effect.runSync(memFsTinyFileSystem.joinPath('/', 'baz.json'))).toEqual('/baz.json');
    });
  });

  describe('relative', () => {
    it('should function correctly', async () => {
      expect(memFsTinyFileSystem.relative('/foo/bar/', '/foo/bar/baz/qux.json')).toEqual('baz/qux.json');
    });
  });

  describe('dirName', () => {
    let stub1: jest.SpyInstance;
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      stub1 = jest
        .spyOn(fs.promises, 'lstat')
        .mockResolvedValue({ isFile: () => true, isDirectory: () => false } as any);
      await expect(P.Effect.runPromise(memFsTinyFileSystem.dirName('foo/bar/baz.json'))).resolves.toEqual('foo/bar');
    });

    it('should function correctly', async () => {
      stub1 = jest
        .spyOn(fs.promises, 'lstat')
        .mockResolvedValue({ isFile: () => false, isDirectory: () => true } as any);
      await expect(P.Effect.runPromise(memFsTinyFileSystem.dirName('foo/bar'))).resolves.toEqual('foo');
    });
  });

  describe('fileName', () => {
    let stub1: jest.SpyInstance;
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      stub1 = jest
        .spyOn(fs.promises, 'lstat')
        .mockResolvedValue({ isFile: () => true, isDirectory: () => false } as any);
      await expect(P.Effect.runPromise(memFsTinyFileSystem.fileName('foo/bar/baz.json'))).resolves.toEqual('baz.json');
    });

    it('should function correctly', async () => {
      stub1 = jest
        .spyOn(fs.promises, 'lstat')
        .mockResolvedValue({ isFile: () => false, isDirectory: () => true } as any);
      await expect(P.Effect.runPromise(memFsTinyFileSystem.fileName('foo/bar'))).rejects.toThrow('TinyFileSystemError');
    });
  });

  describe('basename', () => {
    it('should function correctly', () => {
      expect(memFsTinyFileSystem.basename('foo/bar/baz.json')).toEqual('baz.json');
      expect(memFsTinyFileSystem.basename('foo/bar/baz.json', '.json')).toEqual('baz');
      expect(memFsTinyFileSystem.basename('foo/bar')).toEqual('bar');
      expect(memFsTinyFileSystem.basename('foo/bar/')).toEqual('bar');
      expect(memFsTinyFileSystem.basename('foo/')).toEqual('foo');
      expect(memFsTinyFileSystem.basename('foo')).toEqual('foo');
    });
  });

  describe('extname', () => {
    it('should return the file extension', () => {
      const filePath = '/path/to/file.txt';
      const expected = '.txt';
      const actual = memFsTinyFileSystem.extname(filePath);
      expect(actual).toEqual(expected);
    });
  });

  describe('isAbsolute', () => {
    it('should work as expected', () => {
      expect(memFsTinyFileSystem.isAbsolute('/path/to/file.txt')).toEqual(true);
      expect(memFsTinyFileSystem.isAbsolute('path/to/file.txt')).toEqual(false);
      expect(memFsTinyFileSystem.isAbsolute('./path/to/file.txt')).toEqual(false);
    });
  });
});
