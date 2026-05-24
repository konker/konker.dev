import { PassThrough, Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { arrayBufferToString } from '../array.js';
import { BufferWriteableStream } from './BufferWriteableStream.js';
import * as unit from './index.js';

describe('stream utils', () => {
  describe('readStreamToBuffer', () => {
    it('should resolve as expected', async () => {
      const readStream = Readable.from('konker');
      const data = await unit.readStreamToBuffer(readStream)(undefined);
      expect(data._unsafeUnwrap()).toEqual(new Uint8Array(Buffer.from('konker')));
      expect(arrayBufferToString(data._unsafeUnwrap())).toEqual('konker');
    });

    it('should resolve as expected', async () => {
      const readStream = Readable.from(Buffer.from('konker'));
      const data = await unit.readStreamToBuffer(readStream)(undefined);
      expect(arrayBufferToString(data._unsafeUnwrap())).toEqual('konker');
    });

    it('should reject as expected', async () => {
      const readStream = Readable.from('konker');
      readStream.on('data', () => {
        readStream.emit('error', new Error('Boom!'));
      });

      const data = await unit.readStreamToBuffer(readStream)(undefined);
      expect(data._unsafeUnwrapErr()).toBeInstanceOf(Error);
      expect(data._unsafeUnwrapErr().message).toEqual('Boom!');
    });
  });

  describe('waitForWriteStreamPromise', () => {
    it('should work as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new BufferWriteableStream();
      readStream.pipe(writeStream);

      await unit.waitForWriteStreamPromise(writeStream);
      expect(writeStream.string).toEqual('konker');
    });
  });

  describe('waitForWriteStream', () => {
    it('should work as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new BufferWriteableStream();
      readStream.pipe(writeStream);

      const result = await unit.waitForWriteStream(writeStream)(undefined);
      expect(result._unsafeUnwrap()).toBeUndefined();
      expect(writeStream.string).toEqual('konker');
    });
  });

  describe('waitForStreamPipe', () => {
    it('should resolve as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PassThrough();

      const data = await unit.waitForStreamPipe(readStream, writeStream)(undefined);
      expect(data._unsafeUnwrap()).toEqual(6);
    });

    it('should reject as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PassThrough();
      writeStream.on('data', () => {
        writeStream.emit('error', new Error('Boom!'));
      });

      const data = await unit.waitForStreamPipe(readStream, writeStream)(undefined);
      expect(data._unsafeUnwrapErr()).toBeInstanceOf(Error);
      expect(data._unsafeUnwrapErr().message).toEqual('Boom!');
    });
  });
});
