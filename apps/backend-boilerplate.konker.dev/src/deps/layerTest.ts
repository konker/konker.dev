import { NodeFileSystem } from '@effect/platform-node';
import { Layer, pipe } from 'effect';

import { mockSqlClientLayer } from '../test/mock-sql-client.js';
import { ConfigProviderTest } from './config.js';
import { LoggerTest } from './logger.js';
import { OtelExporterTest } from './otel.js';

// --------------------------------------------------------------------------
export const layerTest = (responseData: Array<unknown>) =>
  pipe(
    Layer.mergeAll(LoggerTest, mockSqlClientLayer(responseData), OtelExporterTest),
    Layer.provideMerge(ConfigProviderTest),
    Layer.provideMerge(NodeFileSystem.layer)
  );
