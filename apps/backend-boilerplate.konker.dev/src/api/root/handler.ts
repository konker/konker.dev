import { NodeFileSystem } from '@effect/platform-node';
import type { RequestW, ResponseW } from '@konker.dev/middleware-fp/http';
import * as M from '@konker.dev/middleware-fp/http/contrib';
import { ignoreCheckServerIdentity } from '@konker.dev/middleware-fp/http/contrib/sqlClientInitPg';
import { Effect, Logger, LogLevel, pipe } from 'effect';
import type { HonoRequest } from 'hono';

import { type Env, EnvSchema } from '../../config/env.schema.js';
import caBundle from '../../config/eu-west-1-bundle.pem.json' with { type: 'json' };
import { core } from './core.js';

export type CoreEvent = RequestW<M.envValidator.WithValidatedEnv<Env>>;
export type CoreResponse = ResponseW;

export const handler = async (event: HonoRequest): Promise<Response> => {
  const stack = pipe(
    core,
    M.sqlClientInitPg.middleware(caBundle.ca, ignoreCheckServerIdentity),
    M.otelTraceExporterInit.middleware('backend-boilerplate'),
    M.helmetJsHeaders.middleware(),
    M.jsonBodySerializerResponse.middleware(),
    M.headersNormalizer.middleware(),
    M.envValidator.middleware(EnvSchema),
    M.responseProcessor.middleware(),
    M.requestResponseLogger.middleware(),
    M.honoAdapter.middleware()
    // TODO: add setLogLevel middleware
  );

  return pipe(
    event,
    stack,
    Logger.withMinimumLogLevel(LogLevel.Debug),
    Effect.provide(NodeFileSystem.layer),
    Effect.runPromise
  );
};
