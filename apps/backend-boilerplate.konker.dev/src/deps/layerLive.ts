import { NodeFileSystem } from '@effect/platform-node';
import { Layer, pipe } from 'effect';

import { ConfigProviderLive } from './config.js';
import { DatabaseLive } from './database.js';
import { LoggerLive } from './logger.js';
import { OtelExporterLive } from './otel.js';

// --------------------------------------------------------------------------
export const layerLive = (serviceName: string) =>
  pipe(
    Layer.mergeAll(LoggerLive, DatabaseLive, OtelExporterLive(serviceName)),
    Layer.provideMerge(ConfigProviderLive),
    Layer.provideMerge(NodeFileSystem.layer)
  );
