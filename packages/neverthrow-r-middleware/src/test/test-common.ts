import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import type { ResultAsyncR } from '@konker.dev/neverthrow-r/types';

import type { Rec } from '../http/RequestResponseHandler.js';
import { EMPTY_REQUEST_W, type RequestW } from '../http/RequestW.js';
import { EMPTY_RESPONSE_W, type ResponseW } from '../http/ResponseW.js';
import type { Logger } from '../lib/Logger.js';

export type LogCall = {
  readonly level: keyof Logger;
  readonly args: ReadonlyArray<unknown>;
};

export function recordingLogger(): { logger: Logger; calls: Array<LogCall> } {
  const calls: Array<LogCall> = [];
  const make =
    (level: keyof Logger) =>
    (...args: ReadonlyArray<unknown>) => {
      calls.push({ level, args });
    };
  return {
    calls,
    logger: {
      debug: make('debug'),
      info: make('info'),
      warn: make('warn'),
      error: make('error'),
    },
  };
}

/** Builds an inner handler that returns `EMPTY_RESPONSE_W` for any input. */
export const echoHandler =
  <I extends Rec, O extends Rec = Rec, R = unknown>(
    body?: O
  ): ((i: RequestW<I>) => ResultAsyncR<R, ResponseW<O>, never>) =>
  (_i) =>
    okAsyncR<ResponseW<O>>({
      ...EMPTY_RESPONSE_W,
      ...(body ?? ({} as O)),
    } as ResponseW<O>);

export const sampleRequestW: RequestW = EMPTY_REQUEST_W;
