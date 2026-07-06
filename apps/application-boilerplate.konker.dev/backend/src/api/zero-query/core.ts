import type { RequestW } from '@konker.dev/middleware-fp/http';
import { queries } from '@konker.dev/zero-sync-common.application-boilerplate.konker.dev/queries';
import { schema } from '@konker.dev/zero-sync-common.application-boilerplate.konker.dev/schema';
import { mustGetQuery, type ReadonlyJSONValue } from '@rocicorp/zero';
import { handleQueryRequest } from '@rocicorp/zero/server';
import { type Cause, Effect, pipe } from 'effect';

import type { CoreEvent, CoreResponse } from './handler';

// --------------------------------------------------------------------------
export function core(event: RequestW<CoreEvent>): Effect.Effect<CoreResponse, Cause.UnknownException> {
  const body = event.body as ReadonlyJSONValue;

  return pipe(
    Effect.tryPromise(async () =>
      handleQueryRequest({
        handler: (name, args) => {
          const query = mustGetQuery(queries, name);
          return query.fn({ args, ctx: { sub: event.userId } });
        },
        schema,
        query: event.queryStringParameters,
        body,
        userID: event.userId,
        logLevel: 'info',
      })
    ),
    Effect.map((response) => ({
      statusCode: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
      },
      body: response,
    }))
  );
}
