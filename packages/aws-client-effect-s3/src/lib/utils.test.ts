import { Readable } from 'node:stream';

import * as Effect from 'effect/Effect';
import { describe, expect, it } from 'vitest';

import { PromiseDependentWritableStream } from './PromiseDependentWritableStream.js';
import * as unit from './utils.js';

describe('stream utils', () => {
  describe('waitForPromiseDependentStreamPipe', () => {
    it('should resolve as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PromiseDependentWritableStream();

      writeStream.promise = new Promise((resolve) => {
        writeStream.on('finish', resolve);
      });

      const data = await Effect.runPromise(unit.waitForPromiseDependentWritableStreamPipe(readStream, writeStream));
      expect(data).toBe(6);
    });

    it('should reject as expected', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PromiseDependentWritableStream();

      writeStream.promise = new Promise((_, reject) => {
        writeStream.on('finish', () => reject(new Error('Access Denied')));
      });

      await expect(
        Effect.runPromise(unit.waitForPromiseDependentWritableStreamPipe(readStream, writeStream))
      ).rejects.toThrow();
    });

    it('should reject if promise is missing', async () => {
      const readStream = Readable.from('konker');
      const writeStream = new PromiseDependentWritableStream();

      await expect(
        Effect.runPromise(unit.waitForPromiseDependentWritableStreamPipe(readStream, writeStream))
      ).rejects.toThrow('waitForPromiseDependentWritableStreamPipe called without a stream promise');
    });
  });
});
