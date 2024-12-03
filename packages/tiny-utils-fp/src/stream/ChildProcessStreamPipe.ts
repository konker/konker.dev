/* eslint-disable fp/no-nil,fp/no-unused-expression,fp/no-mutation,fp/no-this,fp/no-mutating-methods,fp/no-throw,@typescript-eslint/ban-types,fp/no-class */
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { spawn } from 'node:child_process';
import type { TransformCallback } from 'node:stream';
import { Stream } from 'node:stream';
import { isNativeError } from 'node:util/types';

/*
 * See: https://www.jameskerr.blog/posts/pipe-nodejs-readable-stream-into-child-process/
 * See: https://www.npmjs.com/package/imagemagick-stream
 */
export class ChildProcessStreamPipe extends Stream.Transform {
  readonly cmd: string;
  readonly _args: Array<string>;
  _input: string;
  _output: string;
  _execStarted: boolean;
  _childProcess: ChildProcessWithoutNullStreams | undefined;

  constructor(cmd: string, args: Array<string> = []) {
    super();

    this.cmd = cmd;
    this._input = '-';
    this._output = '-';
    this._args = args;
    this._execStarted = false;
  }

  override _transform(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback): void {
    if (!this.destroyed && this._childProcess?.stdin.write(chunk, encoding)) {
      process.nextTick(callback);
    } else if (!this.destroyed) {
      this._childProcess?.stdin.once('drain', callback);
    } else {
      callback();
    }
  }

  override _flush(callback: (error?: Error | null) => void): void {
    this._childProcess?.stdin.end();
    if (this._childProcess?.stdout.destroyed) {
      callback();
    } else {
      this._childProcess?.stdout.on('close', () => callback());
    }
  }

  override resume() {
    if (!this._execStarted) {
      this.exec();
    }
    this._execStarted = true;
    return super.resume();
  }

  input(s: string): ChildProcessStreamPipe {
    this._input = s;
    return this;
  }

  output(s: string): ChildProcessStreamPipe {
    this._output = s;
    return this;
  }

  arg(arg: string): ChildProcessStreamPipe {
    this._args.push(arg);
    return this;
  }

  get args(): Array<string> {
    return this._args.flatMap((x) => x.split(' '));
  }

  exec(): void {
    const onError = this.onError.bind(this);

    try {
      this._childProcess = spawn(this.cmd, [this._input, ...this.args, this._output]);
      this._childProcess.on('error', onError);

      this._childProcess.stdout.on('data', (data: unknown) => this.push(data));

      this._childProcess.stdin?.on('error', (e: any) => {
        if (e.code === 'EPIPE') {
          this.emit('end');
        } else {
          onError(e);
        }
      });
      this._childProcess.stdout.on('error', onError);
      this._childProcess.stderr.on('error', onError);
      this._childProcess.stderr.on('data', (data) => onError(new Error(data.toString())));
    } catch (e: unknown) {
      onError(e);
    }
  }

  onError(err: unknown | undefined) {
    const errorErr = isNativeError(err) ? err : new Error(String(err));
    this.destroy(errorErr);
    this.emit('end');
  }
}
