import { NodeSdk } from '@effect/opentelemetry';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Config, Effect, Layer, pipe } from 'effect';

// --------------------------------------------------------------------------
export const OtelExporterLive = (serviceName: string) =>
  Layer.unwrapEffect(
    pipe(
      Config.string('OTEL_TRACE_EXPORTER_URL'),
      Effect.map((url) =>
        NodeSdk.layer(() => ({
          resource: { serviceName },
          spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({ url })),
        }))
      )
    )
  );

// --------------------------------------------------------------------------
export const OtelExporterTest = Layer.empty;
