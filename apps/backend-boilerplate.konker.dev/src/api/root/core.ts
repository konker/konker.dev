import type { RequestW } from '@konker.dev/middleware-fp/http/request';
import type { ResponseW } from '@konker.dev/middleware-fp/http/response';
import { Effect } from 'effect';

import { API_ID, VERSION } from '../../lib/consts.js';
import type { CoreEvent } from './handler.js';

export function core(event: RequestW<CoreEvent>): Effect.Effect<ResponseW> {
  return Effect.succeed({
    statusCode: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      apiId: API_ID,
      version: VERSION,
      ip: event.headers['x-forwarded-for'] ?? 'UNKNOWN',
    }),
  });
}
