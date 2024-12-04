import { PassThrough, Readable } from 'node:stream';

import * as P from '@konker.dev/effect-ts-prelude';

import { arrayBufferToString } from './array';
import * as unit from './stream';

describe('stream utils', () => {
  describe('readStreamToBuffer', () => {
    it('should resolve as expected', async () => {
      const readStream = Readable.from('konker');
      const data = await P.Effect.runPromise(unit.readStreamToBuffer(readStream));
      expect(arrayBufferToString(data)).toEqual('konker');
    });

    it('should resolve as expected', async () => {
      const readStream = Readable.from(Buffer.from('konker'));
      const data = await P.Effect.runPromise(unit.readStreamToBuffer(readStream));
      expect(arrayBufferToString(data)).toEqual('konker');
    });

    it('should reject as expected', async () => {
      const readStream = Readable.from('konker');
      readStream.on('data', () => {
        readStream.emit('error', new Error('Boom!'));
      });

      await expect(P.Effect.runPromise(unit.readStreamToBuffer(readStream))).rejects.toThrow('Boom!');
    });
  });

  describe('waitForStreamPipe', () => {
    it('should resolve as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PassThrough();

      const data = await P.Effect.runPromise(unit.waitForStreamPipe(readStream, writeStream));
      expect(data).toEqual(6);
    });

    it('should reject as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PassThrough();
      writeStream.on('data', () => {
        writeStream.emit('error', new Error('Boom!'));
      });

      await expect(P.Effect.runPromise(unit.waitForStreamPipe(readStream, writeStream))).rejects.toThrow('Boom!');
    });
  });
});
