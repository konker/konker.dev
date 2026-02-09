import { NodeFileSystem } from '@effect/platform-node';
import { Layer, pipe } from 'effect';

import { EnvProviderLayer } from './config.js';
import { DatabaseLive } from './database.js';
import { LoggerLive } from './logger.js';
import { OtelExporterLive } from './otel.js';

// --------------------------------------------------------------------------
export const liveLayer = (serviceName: string) =>
  pipe(
    Layer.mergeAll(LoggerLive, DatabaseLive, OtelExporterLive(serviceName)),
    Layer.provide(EnvProviderLayer),
    Layer.provide(NodeFileSystem.layer)
  );
