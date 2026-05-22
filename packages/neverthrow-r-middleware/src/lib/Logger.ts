import type { ResultAsyncR } from '@konker.dev/neverthrow-r/types';

export type Logger = {
  readonly debug: (...args: ReadonlyArray<unknown>) => void;
  readonly info: (...args: ReadonlyArray<unknown>) => void;
  readonly warn: (...args: ReadonlyArray<unknown>) => void;
  readonly error: (...args: ReadonlyArray<unknown>) => void;
};

export type WithLogger = { readonly logger: Logger };

const noop = (..._args: ReadonlyArray<unknown>): void => undefined;

export const noopLogger: Logger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

export const consoleLogger: Logger = {
  debug: (...args) => console.debug(...args),
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

/**
 * Side-effect combinator that calls `logger[level](...args)` from the `R`
 * channel and passes the value through unchanged. Adds `WithLogger` to the
 * chain's requirements.
 */
export const tapLogger =
  (level: keyof Logger, ...args: ReadonlyArray<unknown>) =>
  <R, T, E>(rar: ResultAsyncR<R, T, E>): ResultAsyncR<R & WithLogger, T, E> =>
  (r) =>
    rar(r).map((t) => {
      r.logger[level](...args);
      return t;
    });

/**
 * Like {@link tapLogger}, but the args are computed from the current value.
 */
export const tapLoggerWith =
  <T>(level: keyof Logger, build: (t: T) => ReadonlyArray<unknown>) =>
  <R, E>(rar: ResultAsyncR<R, T, E>): ResultAsyncR<R & WithLogger, T, E> =>
  (r) =>
    rar(r).map((t) => {
      r.logger[level](...build(t));
      return t;
    });
