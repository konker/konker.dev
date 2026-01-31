import { NodeSdk } from '@effect/opentelemetry';
import { basicAuthEncodeHeaderValue } from '@konker.dev/tiny-auth-utils-fp/basic-auth';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../../index.js';
import type { RequestW } from '../../RequestW.js';
import type { WithValidatedEnv } from '../envValidator.js';

const TAG = 'otelTraceExporterInit';

export type OtelTraceExporterInitParams = {
  OTEL_TRACE_SINK_URL: string;
  OTEL_TRACE_SINK_BASIC_AUTH_USERNAME: string;
  OTEL_TRACE_SINK_BASIC_AUTH_PASSWORD: string;
};

export const middleware =
  <V extends OtelTraceExporterInitParams>(serviceName: string) =>
  <I extends WithValidatedEnv<V>, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R>
  ): RequestResponseHandler<I, O, E | Error, R> =>
  (i: RequestW<I>) => {
    return pipe(
      basicAuthEncodeHeaderValue({
        username: i.validatedEnv.OTEL_TRACE_SINK_BASIC_AUTH_USERNAME,
        password: i.validatedEnv.OTEL_TRACE_SINK_BASIC_AUTH_PASSWORD,
      }),
      Effect.flatMap((_basicAuthHeaderValue) =>
        pipe(
          Effect.succeed(i),
          Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
          Effect.flatMap(wrapped),
          Effect.provide(
            NodeSdk.layer(() => ({
              resource: { serviceName },
              spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter()),
            }))
          ),
          Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
        )
      )
    );
  };
