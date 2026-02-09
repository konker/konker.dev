import { Layer } from 'effect';

import { LoggerTest } from './logger.js';
import { OtelExporterTest } from './otel.js';

// --------------------------------------------------------------------------
export const testLayer = Layer.mergeAll(LoggerTest, OtelExporterTest);
