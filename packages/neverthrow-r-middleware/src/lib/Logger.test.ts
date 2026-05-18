import { okAsyncR } from '@konker.dev/neverthrow-r/constructors';
import { describe, expect, it } from 'vitest';

import type { Logger, WithLogger } from './Logger.js';
import { consoleLogger, noopLogger, tapLogger, tapLoggerWith } from './Logger.js';

function recordingLogger(): {
  logger: Logger;
  calls: Array<{ level: string; args: ReadonlyArray<unknown> }>;
} {
  const calls: Array<{ level: string; args: ReadonlyArray<unknown> }> = [];
  const make =
    (level: string) =>
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

describe('noopLogger', () => {
  it('does nothing for every method and returns undefined', () => {
    expect(noopLogger.debug('x')).toBeUndefined();
    expect(noopLogger.info('x')).toBeUndefined();
    expect(noopLogger.warn('x')).toBeUndefined();
    expect(noopLogger.error('x')).toBeUndefined();
  });
});

describe('consoleLogger', () => {
  it('delegates to console without throwing', () => {
    // We don't assert on output; just exercise the methods so coverage is met.
    expect(() => consoleLogger.debug('debug')).not.toThrow();
    expect(() => consoleLogger.info('info')).not.toThrow();
    expect(() => consoleLogger.warn('warn')).not.toThrow();
    expect(() => consoleLogger.error('error')).not.toThrow();
  });
});

describe('tapLogger', () => {
  it('calls the chosen level with the supplied args and passes the value through', async () => {
    const { calls, logger } = recordingLogger();
    const result = await tapLogger('info', 'hello')(okAsyncR<number>(42))({
      logger,
    } satisfies WithLogger);
    expect(result.isOk() && result.value).toBe(42);
    expect(calls).toEqual([{ level: 'info', args: ['hello'] }]);
  });
});

describe('tapLoggerWith', () => {
  it('builds args from the current value', async () => {
    const { calls, logger } = recordingLogger();
    const result = await tapLoggerWith<number>('debug', (n) => ['n=', n])(okAsyncR<number>(7))({ logger });
    expect(result.isOk() && result.value).toBe(7);
    expect(calls).toEqual([{ level: 'debug', args: ['n=', 7] }]);
  });
});
