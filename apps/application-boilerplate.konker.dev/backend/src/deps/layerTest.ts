import { NodeFileSystem } from '@effect/platform-node';
import { Layer, pipe } from 'effect';

import { ConfigProviderTest } from './config.js';
import { DatabaseTest } from './database.js';
import { JwtAuthTest } from './jwtAuth.js';
import { LoggerTest } from './logger.js';
import { OtelExporterTest } from './otel.js';

// --------------------------------------------------------------------------
export const layerTest = (serviceName: string, env: Record<string, string>, responseData: Array<unknown>) =>
  pipe(
    Layer.mergeAll(LoggerTest, DatabaseTest(responseData), JwtAuthTest, OtelExporterTest(serviceName)),
    Layer.provideMerge(ConfigProviderTest(env)),
    Layer.provideMerge(NodeFileSystem.layer)
  );
