import { Writable } from 'stream';

import { PromiseDependentWritableStream } from './PromiseDependentWritableStream';

describe('PromiseDependentWritableStream', () => {
  it('should be a Writable stream', () => {
    expect(new PromiseDependentWritableStream()).toBeInstanceOf(Writable);
  });

  it('should store the promise', () => {
    const promiseDependentWritableStream = new PromiseDependentWritableStream();
    const p = Promise.resolve('test');
    // eslint-disable-next-line fp/no-mutation
    promiseDependentWritableStream.promise = p;
    expect(promiseDependentWritableStream.promise).toBe(p);
  });
});
