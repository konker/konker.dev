import { NodeFileSystem } from '@effect/platform-node';
import type { RequestW, ResponseW } from '@konker.dev/middleware-fp/http';
import * as M from '@konker.dev/middleware-fp/http/contrib';
import { LogLevel, type ManagedRuntime, pipe } from 'effect';
import type { HonoRequest } from 'hono';

import { type Env, EnvSchema } from '../../config/env.schema.js';
import { core } from './core.js';

export type CoreEvent = RequestW<M.envValidator.WithValidatedEnv<Env>>;
export type CoreResponse = ResponseW;

export const handler =
  <R, ER>(runtime: ManagedRuntime.ManagedRuntime<R, ER>) =>
  async (event: HonoRequest): Promise<Response> => {
    const stack = pipe(
      core,
      M.requestSpan.middleware('request-inner'),
      M.otelTraceExporterInit.middleware('backend-boilerplate'),
      M.provideLayer.middleware(NodeFileSystem.layer),
      M.helmetJsHeaders.middleware(),
      M.jsonBodySerializerResponse.middleware(),
      M.headersNormalizer.middleware(),
      M.envValidator.middleware(EnvSchema),
      M.responseProcessor.middleware(),
      M.requestResponseLogger.middleware(),
      M.setLogLevel.middleware(LogLevel.Debug),
      M.honoAdapter.middleware()
    );

    return pipe(event, stack, runtime.runPromise);
  };
