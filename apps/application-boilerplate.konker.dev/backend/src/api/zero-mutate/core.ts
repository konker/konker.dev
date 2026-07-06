import type { RequestW } from '@konker.dev/middleware-fp/http';
import { mustGetMutator, type ReadonlyJSONValue } from '@rocicorp/zero';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { type Cause, Effect, pipe } from 'effect';

import { getDbProvider } from '../../zero/db.js';
import { serverMutators } from '../../zero/server-mutators.js';
import type { CoreEvent, CoreResponse } from './handler';

// --------------------------------------------------------------------------
export function core(event: RequestW<CoreEvent>): Effect.Effect<CoreResponse, Cause.UnknownException> {
  const body = event.body as ReadonlyJSONValue;

  return pipe(
    Effect.tryPromise(async () =>
      handleMutateRequest({
        dbProvider: getDbProvider(),
        handler: async (transact) =>
          transact(async (tx, name, args) => {
            const mutator = mustGetMutator(serverMutators, name);
            return mutator.fn({ tx, args, ctx: { sub: event.userId } });
          }),
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
