import * as Effect from 'effect/Effect';
import fg from 'fast-glob';
import fs from 'fs';
import readline from 'readline';
import { PassThrough, Readable, Writable } from 'stream';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import type { DirectoryPath } from '../index.js';
import { FileType } from '../index.js';
import { arrayBufferToString, stringToUint8Array } from '../lib/array.js';
import { NodeTinyFileSystem as unit } from './index.js';

describe('NodeTinyFileSystem', () => {
  describe('getFileReadStream', () => {
    let stub1: MockInstance;
    beforeEach(() => {
      stub1 = vi.spyOn(fs, 'createReadStream').mockReturnValue(new Readable() as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const data = await Effect.runPromise(unit.getFileReadStream('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0]?.[0]).toBe('/foo/bar.txt');
      expect(data).toBeInstanceOf(Readable);
    });
  });

  describe('getFileLineReadStream', () => {
    let stub1: MockInstance;
    beforeEach(() => {
      stub1 = vi.spyOn(fs, 'createReadStream').mockReturnValue(new PassThrough() as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const data = await Effect.runPromise(unit.getFileLineReadStream('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0]?.[0]).toBe('/foo/bar.txt');
      expect(data).toBeInstanceOf(readline.Interface);
    });
  });

  describe('getFileWriteStream', () => {
    let stub1: MockInstance;
    beforeEach(() => {
      stub1 = vi.spyOn(fs, 'createWriteStream').mockReturnValue(new PassThrough() as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const data = await Effect.runPromise(unit.getFileWriteStream('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0]?.[0]).toBe('/foo/bar.txt');
      expect(stub1.mock.calls[0]?.[1]).toStrictEqual({ flags: 'w' });
      expect(data).toBeInstanceOf(Writable);
    });
  });

  describe('getFileAppendWriteStream', () => {
    let stub1: MockInstance;
    beforeEach(() => {
      stub1 = vi.spyOn(fs, 'createWriteStream').mockReturnValue(new PassThrough() as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const data = await Effect.runPromise(unit.getFileAppendWriteStream('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0]?.[0]).toBe('/foo/bar.txt');
      expect(stub1.mock.calls[0]?.[1]).toStrictEqual({ flags: 'a' });
      expect(data).toBeInstanceOf(Writable);
    });
  });

  describe('listFiles', () => {
    let stub1: MockInstance;
    beforeEach(() => {
      stub1 = vi.spyOn(fs.promises, 'readdir').mockReturnValue(['test-file.txt'] as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const files = await Effect.runPromise(unit.listFiles('./foo/bar'));
      expect(stub1).toHaveBeenCalledTimes(1);
      expect(files[0]).toBe('foo/bar/test-file.txt');
    });

    it('should function correctly', async () => {
      const files = await Effect.runPromise(unit.listFiles('foo/bar'));
      expect(stub1).toHaveBeenCalledTimes(1);
      expect(files[0]).toBe('foo/bar/test-file.txt');
    });

    it('should function correctly', async () => {
      const files = await Effect.runPromise(unit.listFiles('/foo/bar'));
      expect(stub1).toHaveBeenCalledTimes(1);
      expect(files[0]).toBe('/foo/bar/test-file.txt');
    });
  });

  describe('glob', () => {
    let stub1: MockInstance;
    beforeEach(() => {
      stub1 = vi.spyOn(fg, 'async').mockReturnValue(['/foo/bar/test-file.txt'] as any);
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const files = await Effect.runPromise(unit.glob('./foo/bar'));
      expect(stub1).toHaveBeenCalledTimes(1);
      expect(files).toStrictEqual(['/foo/bar/test-file.txt']);
    });
  });

  describe('exists', () => {
    let stub1: MockInstance;
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      stub1 = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      const data = await Effect.runPromise(unit.exists('./foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(data).toBe(true);
    });

    it('should function correctly', async () => {
      stub1 = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const data = await Effect.runPromise(unit.exists('./foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(data).toBe(false);
    });
  });

  describe('getFileType', () => {
    let stub1: MockInstance;
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      stub1 = vi.spyOn(fs.promises, 'lstat').mockReturnValue({ isFile: () => true, isDirectory: () => false } as any);
      const data = await Effect.runPromise(unit.getFileType('./foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(data).toBe(FileType.File);
    });

    it('should function correctly', async () => {
      stub1 = vi.spyOn(fs.promises, 'lstat').mockReturnValue({ isFile: () => false, isDirectory: () => true } as any);
      const data = await Effect.runPromise(unit.getFileType('./foo'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(data).toBe(FileType.Directory);
    });

    it('should function correctly', async () => {
      stub1 = vi.spyOn(fs.promises, 'lstat').mockReturnValue({ isFile: () => false, isDirectory: () => false } as any);
      const data = await Effect.runPromise(unit.getFileType('.'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(data).toBe(FileType.Other);
    });
  });

  describe('createDirectory', () => {
    let stub1: MockInstance;
    let stub2: MockInstance;
    beforeEach(() => {
      stub2 = vi.spyOn(fs.promises, 'mkdir').mockResolvedValue('ok');
    });
    afterEach(() => {
      stub1.mockClear();
      stub2.mockClear();
    });

    it('should function correctly, directory does not exist', async () => {
      stub1 = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      await Effect.runPromise(unit.createDirectory('/foo/baz' as DirectoryPath));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub2).toHaveBeenCalledTimes(1);
      expect(stub2.mock.calls[0]?.[0]).toBe('/foo/baz');
    });

    it('should function correctly, directory exists', async () => {
      stub1 = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      await Effect.runPromise(unit.createDirectory('/foo/baz' as DirectoryPath));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub2).toHaveBeenCalledTimes(0);
    });
  });

  describe('removeDirectory', () => {
    let stub1: MockInstance;
    let stub2: MockInstance;
    beforeEach(() => {
      stub2 = vi.spyOn(fs.promises, 'rm').mockResolvedValue();
    });
    afterEach(() => {
      stub1.mockClear();
      stub2.mockClear();
    });

    it('should function correctly, directory does not exist', async () => {
      stub1 = vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      await Effect.runPromise(unit.removeDirectory('/foo/baz' as DirectoryPath));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub2).toHaveBeenCalledTimes(0);
    });

    it('should function correctly, directory exists', async () => {
      stub1 = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      await Effect.runPromise(unit.removeDirectory('/foo/baz' as DirectoryPath));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub2).toHaveBeenCalledTimes(1);
      expect(stub2.mock.calls[0]?.[0]).toBe('/foo/baz');
    });
  });

  describe('readFile', () => {
    let stub1: MockInstance;
    beforeEach(() => {
      stub1 = vi.spyOn(fs.promises, 'readFile').mockResolvedValue(Buffer.from('some test text'));
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      const data = await Effect.runPromise(unit.readFile('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0]?.[0]).toBe('/foo/bar.txt');
      expect(arrayBufferToString(data)).toBe('some test text');
    });
  });

  describe('writeFile', () => {
    let stub1: MockInstance;
    beforeEach(() => {
      stub1 = vi.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly with string input', async () => {
      await Effect.runPromise(unit.writeFile('/foo/bar.txt', 'some test text'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0]?.[0]).toBe('/foo/bar.txt');
      expect(stub1.mock.calls[0]?.[1]).toStrictEqual('some test text');
    });

    it('should function correctly with Uint8Array input', async () => {
      await Effect.runPromise(unit.writeFile('/foo/bar.txt', stringToUint8Array('some test text')));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0]?.[0]).toBe('/foo/bar.txt');
      expect(stub1.mock.calls[0]?.[1]).toStrictEqual(Buffer.from('some test text'));
    });

    it('should function correctly with ArrayBuffer input', async () => {
      await Effect.runPromise(
        unit.writeFile('/foo/bar.txt', stringToUint8Array('some test text').buffer as ArrayBuffer)
      );

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0]?.[0]).toBe('/foo/bar.txt');
      expect(stub1.mock.calls[0]?.[1]).toStrictEqual(stringToUint8Array('some test text'));
    });
  });

  describe('deleteFile', () => {
    let stub1: MockInstance;
    beforeEach(() => {
      stub1 = vi.spyOn(fs.promises, 'unlink').mockResolvedValue();
    });
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      await Effect.runPromise(unit.deleteFile('/foo/bar.txt'));

      expect(stub1).toHaveBeenCalledTimes(1);
      expect(stub1.mock.calls[0]?.[0]).toBe('/foo/bar.txt');
    });
  });

  describe('joinPath', () => {
    it('should function correctly', async () => {
      expect(Effect.runSync(unit.joinPath('foo', 'bar', 'baz.json'))).toEqual('foo/bar/baz.json');
      expect(Effect.runSync(unit.joinPath('foo/bar', 'baz.json'))).toEqual('foo/bar/baz.json');
      expect(Effect.runSync(unit.joinPath('/foo', 'baz.json'))).toEqual('/foo/baz.json');
      expect(Effect.runSync(unit.joinPath('/', 'baz.json'))).toEqual('/baz.json');
    });
  });

  describe('relative', () => {
    it('should function correctly', async () => {
      expect(unit.relative('/foo/bar/', '/foo/bar/baz/qux.json')).toEqual('baz/qux.json');
    });
  });

  describe('dirName', () => {
    let stub1: MockInstance;
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      stub1 = vi.spyOn(fs.promises, 'lstat').mockResolvedValue({ isFile: () => true, isDirectory: () => false } as any);
      await expect(Effect.runPromise(unit.dirName('foo/bar/baz.json'))).resolves.toEqual('foo/bar');
    });

    it('should function correctly', async () => {
      stub1 = vi.spyOn(fs.promises, 'lstat').mockResolvedValue({ isFile: () => false, isDirectory: () => true } as any);
      await expect(Effect.runPromise(unit.dirName('foo/bar'))).resolves.toEqual('foo');
    });
  });

  describe('fileName', () => {
    let stub1: MockInstance;
    afterEach(() => {
      stub1.mockClear();
    });

    it('should function correctly', async () => {
      stub1 = vi.spyOn(fs.promises, 'lstat').mockResolvedValue({ isFile: () => true, isDirectory: () => false } as any);
      await expect(Effect.runPromise(unit.fileName('foo/bar/baz.json'))).resolves.toEqual('baz.json');
    });

    it('should function correctly', async () => {
      stub1 = vi.spyOn(fs.promises, 'lstat').mockResolvedValue({ isFile: () => false, isDirectory: () => true } as any);
      await expect(Effect.runPromise(unit.fileName('foo/bar'))).rejects.toThrow('TinyFileSystemError');
    });
  });

  describe('basename', () => {
    it('should function correctly', () => {
      expect(unit.basename('foo/bar/baz.json')).toEqual('baz.json');
      expect(unit.basename('foo/bar/baz.json', '.json')).toEqual('baz');
      expect(unit.basename('foo/bar')).toEqual('bar');
      expect(unit.basename('foo/bar/')).toEqual('bar');
      expect(unit.basename('foo/')).toEqual('foo');
      expect(unit.basename('foo')).toEqual('foo');
    });
  });

  describe('extname', () => {
    it('should return the file extension', () => {
      const filePath = '/path/to/file.txt';
      const expected = '.txt';
      const actual = unit.extname(filePath);
      expect(actual).toEqual(expected);
    });
  });

  describe('isAbsolute', () => {
    it('should work as expected', () => {
      expect(unit.isAbsolute('/path/to/file.txt')).toEqual(true);
      expect(unit.isAbsolute('path/to/file.txt')).toEqual(false);
      expect(unit.isAbsolute('./path/to/file.txt')).toEqual(false);
    });
  });
});
