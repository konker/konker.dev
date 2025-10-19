import type { RequestW, ResponseW } from '@konker.dev/middleware-fp/http';
import * as M from '@konker.dev/middleware-fp/http/contrib';
import { Effect, pipe } from 'effect';
import type { HonoRequest } from 'hono';

import { core } from './core.js';

export type CoreEvent = RequestW;
export type CoreResponse = ResponseW;

export const handler = async (event: HonoRequest): Promise<Response> => {
  const stack = pipe(
    core,
    M.helmetJsHeaders.middleware(),
    M.jsonBodyParser.middleware(),
    M.headersNormalizer.middleware(),
    M.responseProcessor.middleware(),
    M.requestResponseLogger.middleware(),
    M.honoAdapter.middleware()
  );
  return pipe(event, stack, Effect.runPromise);
};
