import type { RequestW, ResponseW } from '@konker.dev/middleware-fp/http';
import * as M from '@konker.dev/middleware-fp/http/contrib';
import { pipe } from 'effect';
import type { HonoRequest } from 'hono';

import { type Env, EnvSchema } from '../../config/env.schema.js';
import type { RuntimeLive } from '../../deps/runtimeLive';
import { core } from './core.js';

export type CoreEvent = RequestW<M.envValidator.WithValidatedEnv<Env>>;
export type CoreResponse = ResponseW;

export const handler =
  (runtime: RuntimeLive) =>
  async (event: HonoRequest): Promise<Response> => {
    const stack = pipe(
      core,
      M.requestSpan.middleware('request-inner'),
      M.helmetJsHeaders.middleware(),
      M.jsonBodySerializerResponse.middleware(),
      M.headersNormalizer.middleware(),
      M.envValidator.middleware(EnvSchema),
      M.responseProcessor.middleware(),
      M.requestResponseLogger.middleware(),
      M.honoAdapter.middleware()
    );

    return pipe(event, stack, runtime.runPromise);
  };
