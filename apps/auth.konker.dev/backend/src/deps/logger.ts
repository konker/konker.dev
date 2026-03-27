import { Config, Effect, Layer, Logger, LogLevel, pipe } from 'effect';

// --------------------------------------------------------------------------
export const LoggerLive = Layer.unwrapEffect(
  pipe(
    Config.string('LOG_LEVEL'),
    Effect.map((level) => Logger.minimumLogLevel(LogLevel.fromLiteral(level as LogLevel.Literal)))
  )
);

// --------------------------------------------------------------------------
export const LoggerTest = Layer.merge(Logger.pretty, Logger.minimumLogLevel(LogLevel.Trace));
