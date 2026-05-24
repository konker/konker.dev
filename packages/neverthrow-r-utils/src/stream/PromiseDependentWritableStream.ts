import type { Writable } from 'node:stream';
import { PassThrough } from 'node:stream';

/**
 * A Writable stream which can have an external promise injected into it.
 * The purpose of this is so that the stream can be kept alive until the promise resolves.
 */
// eslint-disable-next-line fp/no-class
export class PromiseDependentWritableStream extends PassThrough implements Writable {
  promise: Promise<unknown> | undefined;
}
