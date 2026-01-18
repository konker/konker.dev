import { NodeFileSystem } from '@effect/platform-node';
import type { RequestW, ResponseW } from '@konker.dev/middleware-fp/http';
import * as M from '@konker.dev/middleware-fp/http/contrib';
import { Effect, pipe } from 'effect';
import type { HonoRequest } from 'hono';

import { type Env, EnvSchema } from '../../config/env.schema.js';
import { core } from './core.js';

export type CoreEvent = RequestW<M.envValidator.WithValidatedEnv<Env>>;
export type CoreResponse = ResponseW;

export const handler = async (event: HonoRequest): Promise<Response> => {
  const stack = pipe(
    core,
    M.sqlClientInitPg.middleware(),
    M.helmetJsHeaders.middleware(),
    M.jsonBodySerializerResponse.middleware(),
    M.headersNormalizer.middleware(),
    M.envValidator.middleware(EnvSchema),
    M.responseProcessor.middleware(),
    M.requestResponseLogger.middleware(),
    M.honoAdapter.middleware()
  );

  return pipe(event, stack, Effect.provide(NodeFileSystem.layer), Effect.runPromise);
};
