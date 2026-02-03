import { NodeSdk } from '@effect/opentelemetry';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../../index.js';
import type { RequestW } from '../../RequestW.js';
import type { WithValidatedEnv } from '../envValidator.js';

const TAG = 'otelTraceExporterInit';

export type OtelTraceExporterInitParams = {
  OTEL_TRACE_EXPORTER_URL: string;
};

export const middleware =
  <V extends OtelTraceExporterInitParams>(serviceName: string) =>
  <I extends WithValidatedEnv<V>, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E | Error, R> =>
  (i: RequestW<I>) => {
    return pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(wrapped),
      Effect.provide(
        NodeSdk.layer(() => ({
          resource: { serviceName },
          spanProcessor: new BatchSpanProcessor(
            new OTLPTraceExporter({
              url: i.validatedEnv.OTEL_TRACE_EXPORTER_URL,
              keepAlive: true,
              httpAgentOptions: {
                keepAlive: true,
                maxSockets: 10,
              },
            })
          ),
        }))
      ),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
  };
