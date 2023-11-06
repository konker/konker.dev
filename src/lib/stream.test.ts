import { PassThrough, Readable } from 'node:stream';

import * as P from '@konker.dev/effect-ts-prelude';

import { PromiseDependentWritableStream } from './PromiseDependentWritableStream';
import * as streamUtils from './stream';

describe('stream utils', () => {
  describe('waitForStreamPipe', () => {
    it('should resolve as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PassThrough();

      const data = await P.Effect.runPromise(streamUtils.waitForStreamPipe(readStream, writeStream));
      expect(data).toBe(6);
    });

    it('should reject as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PassThrough();
      writeStream.on('data', () => {
        writeStream.emit('error', new Error('Boom!'));
      });

      await expect(P.Effect.runPromise(streamUtils.waitForStreamPipe(readStream, writeStream))).rejects.toThrowError(
        'Boom!'
      );
    });
  });

  describe('waitForPromiseDependentStreamPipe', () => {
    it('should resolve as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PromiseDependentWritableStream();
      // eslint-disable-next-line fp/no-mutation
      writeStream.promise = new Promise((resolve) => {
        writeStream.on('finish', resolve);
      });

      const data = await P.Effect.runPromise(
        streamUtils.waitForPromiseDependentWritableStreamPipe(readStream, writeStream)
      );
      expect(data).toBe(6);
    });

    it('should reject as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PromiseDependentWritableStream();
      // eslint-disable-next-line fp/no-mutation
      writeStream.promise = new Promise((_, reject) => {
        writeStream.on('finish', () => reject(new Error('Access Denied')));
      });

      await expect(
        P.Effect.runPromise(streamUtils.waitForPromiseDependentWritableStreamPipe(readStream, writeStream))
      ).rejects.toThrowError();
    });

    it('should reject if promise is missing', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PromiseDependentWritableStream();

      await expect(
        P.Effect.runPromise(streamUtils.waitForPromiseDependentWritableStreamPipe(readStream, writeStream))
      ).rejects.toThrowError('waitForPromiseDependentWritableStreamPipe called without a stream promise');
    });
  });
});
