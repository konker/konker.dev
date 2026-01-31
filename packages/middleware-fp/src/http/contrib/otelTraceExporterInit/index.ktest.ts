/*
import { NodeSdk } from '@effect/opentelemetry';
import * as auth from '@konker.dev/tiny-auth-utils-fp/basic-auth';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { echoCoreIn200W } from '../../../test/test-common.js';
import { EMPTY_REQUEST_W, makeRequestW } from '../../RequestW.js';
import * as unit from './index.js';

const oltpConstructorSpy = vi.hoisted(() => vi.fn());
const batchConstructorSpy = vi.hoisted(() => vi.fn());
const lastExporter = vi.hoisted(() => ({ current: undefined as undefined | object }));

vi.mock('@opentelemetry/exporter-trace-otlp-http', () => {
  class MockOTLPTraceExporter {
    options: unknown;

    constructor(options: unknown) {
      this.options = options;
      lastExporter.current = this;
      oltpConstructorSpy(options);
    }
  }

  return { OTLPTraceExporter: MockOTLPTraceExporter };
});

vi.mock('@opentelemetry/sdk-trace-base', () => {
  class MockBatchSpanProcessor {
    exporter: unknown;
    constructor(exporter: unknown) {
      this.exporter = exporter;
      batchConstructorSpy(exporter);
    }
  }

  return { BatchSpanProcessor: MockBatchSpanProcessor };
});

vi.mock('@effect/opentelemetry', () => ({
  NodeSdk: {
    layer: vi.fn(),
  },
}));

describe('middleware/otel-trace-exporter-init', () => {
  describe('middleware', () => {
    beforeEach(() => {
      oltpConstructorSpy.mockClear();
      batchConstructorSpy.mockClear();
      lastExporter.current = undefined;
      vi.mocked(NodeSdk.layer).mockClear();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should configure the otel exporter layer and pass through', async () => {
      const nodeSdkLayerSpy = vi.spyOn(NodeSdk, 'layer');
      const layerConfig = { current: undefined as undefined | Record<string, unknown> };

      const authSpy = vi.spyOn(auth, 'basicAuthEncodeHeaderValue').mockReturnValue(Effect.succeed('Basic test-auth'));

      const egHandler = pipe(echoCoreIn200W, unit.middleware());
      const testIn = makeRequestW(EMPTY_REQUEST_W, {
        validatedEnv: {
          OTEL_TRACE_SINK_URL: 'https://example.com/trace',
          OTEL_TRACE_SINK_BASIC_AUTH_USERNAME: 'user',
          OTEL_TRACE_SINK_BASIC_AUTH_PASSWORD: 'pass',
        },
      });

      const result = await pipe(egHandler(testIn), Effect.runPromise);

      expect(result).toMatchObject({
        body: 'OK',
        headers: {},
        in: {
          url: '/',
          headers: {},
          method: 'GET',
          pathParameters: {},
          queryStringParameters: {},
          validatedEnv: {
            OTEL_TRACE_SINK_URL: 'https://example.com/trace',
            OTEL_TRACE_SINK_BASIC_AUTH_USERNAME: 'user',
            OTEL_TRACE_SINK_BASIC_AUTH_PASSWORD: 'pass',
          },
        },
        statusCode: 200,
      });

      expect(authSpy).toHaveBeenCalledTimes(1);
      expect(authSpy).toHaveBeenCalledWith({
        username: 'user',
        password: 'pass',
      });
      expect(nodeSdkLayerSpy).toHaveBeenCalledTimes(1);
      expect(layerConfig.current).toMatchObject({
        resource: { serviceName: 'example' },
      });
      expect(oltpConstructorSpy).toHaveBeenCalledWith({
        url: 'https://example.com/trace',
        headers: { Authorization: 'Basic test-auth' },
      });
      expect(batchConstructorSpy).toHaveBeenCalledWith(lastExporter.current);
    });

    it('should fail when basic auth encoding fails', async () => {
      vi.spyOn(auth, 'basicAuthEncodeHeaderValue').mockReturnValue(Effect.fail(new Error('nope')));

      const egHandler = pipe(echoCoreIn200W, unit.middleware());
      const testIn = makeRequestW(EMPTY_REQUEST_W, {
        validatedEnv: {
          OTEL_TRACE_SINK_URL: 'https://example.com/trace',
          OTEL_TRACE_SINK_BASIC_AUTH_USERNAME: 'user',
          OTEL_TRACE_SINK_BASIC_AUTH_PASSWORD: 'pass',
        },
      });

      const result = pipe(egHandler(testIn), Effect.runPromise);

      await expect(result).rejects.toThrow('nope');
      expect(NodeSdk.layer).not.toHaveBeenCalled();
    });
  });
});
*/
