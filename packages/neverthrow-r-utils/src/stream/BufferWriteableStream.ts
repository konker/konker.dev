/* eslint-disable fp/no-class,fp/no-unused-expression,fp/no-nil,fp/no-mutating-methods,fp/no-this,fp/no-mutation */
import { Writable } from 'node:stream';

/**
 * Simplistic implementation of a Writeable which stores the data in a Buffer
 * The contents can be extracted as a Buffer or as a UTF-8 string.
 *
 * Mainly useful for testing stream based code. If something like this is
 * needed for production use, consider a more comprehensive/optimized
 * implementation such as: https://github.com/samcday/node-stream-buffer
 */
export class BufferWriteableStream extends Writable {
  readonly bufferList: Array<Buffer>;

  constructor() {
    super();
    this.bufferList = [];
  }

  override _write(chunk: never, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.bufferList.push(Buffer.from(chunk));
    callback();
  }

  /**
   * Get the current size of the data in the buffer
   */
  get size(): number {
    return this.bufferList.reduce((acc, val) => acc + val.length, 0);
  }

  /**
   * Get the underlying buffer for this stream
   */
  get buffer(): Buffer {
    return Buffer.concat(this.bufferList);
  }

  /**
   * Get the contents of the buffer as a UTF-8 string
   */
  get string(): string {
    return this.buffer.toString('utf8');
  }
}
