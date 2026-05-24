import { Writable } from 'stream';
import { describe, expect, it } from 'vitest';

import { PromiseDependentWritableStream } from './PromiseDependentWritableStream.js';

describe('PromiseDependentWritableStream', () => {
  it('should be a Writable stream', () => {
    expect(new PromiseDependentWritableStream()).toBeInstanceOf(Writable);
  });

  it('should store the promise', () => {
    const promiseDependentWritableStream = new PromiseDependentWritableStream();
    const p = Promise.resolve('test');

    promiseDependentWritableStream.promise = p;
    expect(promiseDependentWritableStream.promise).toBe(p);
  });
});
