import { Readable } from 'node:stream';

import * as P from '@konker.dev/effect-ts-prelude';

import { PromiseDependentWritableStream } from './PromiseDependentWritableStream';
import * as unit from './utils';

describe('stream utils', () => {
  describe('waitForPromiseDependentStreamPipe', () => {
    it('should resolve as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PromiseDependentWritableStream();
      // eslint-disable-next-line fp/no-mutation
      writeStream.promise = new Promise((resolve) => {
        writeStream.on('finish', resolve);
      });

      const data = await P.Effect.runPromise(unit.waitForPromiseDependentWritableStreamPipe(readStream, writeStream));
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
        P.Effect.runPromise(unit.waitForPromiseDependentWritableStreamPipe(readStream, writeStream))
      ).rejects.toThrow();
    });

    it('should reject if promise is missing', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PromiseDependentWritableStream();

      await expect(
        P.Effect.runPromise(unit.waitForPromiseDependentWritableStreamPipe(readStream, writeStream))
      ).rejects.toThrow('waitForPromiseDependentWritableStreamPipe called without a stream promise');
    });
  });
});
