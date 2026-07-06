import type { RequestW } from '@konker.dev/middleware-fp/http';
import { Effect, pipe } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './core.js';
import type { CoreEvent } from './handler.js';

// The middleware stack (jsonBodyParserRequest) normally parses the request body
// into a JSON value, and jwtAuthenticator sets a guaranteed-string userId; here we
// construct that post-middleware shape directly.
function makeEvent(body: unknown, userId = 'test-user-123'): RequestW<CoreEvent> {
  return {
    url: '/zero/query',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    queryStringParameters: {},
    pathParameters: {},
    userId,
    body,
    validatedEnv: {},
  } as unknown as RequestW<CoreEvent>;
}

describe('zero-query/core', () => {
  it('transforms a synced query into an AST response', async () => {
    const actual = await pipe(
      makeEvent(['transform', [{ id: 'q1', name: 'allWidgets', args: [] }]]),
      unit.core,
      Effect.runPromise
    );

    expect(actual.statusCode).toBe(200);
    expect(actual.headers).toStrictEqual({ 'content-type': 'application/json; charset=utf-8' });
    expect(actual.body).toStrictEqual(
      expect.objectContaining({
        queries: [expect.objectContaining({ id: 'q1', name: 'allWidgets', ast: expect.anything() })],
      })
    );
  });

  it('echoes the authenticated userID', async () => {
    const actual = await pipe(
      makeEvent(['transform', [{ id: 'q1', name: 'allWidgets', args: [] }]], 'user-abc'),
      unit.core,
      Effect.runPromise
    );

    expect((actual.body as { userID?: string }).userID).toBe('user-abc');
  });

  it('returns a per-query error for an unknown query name', async () => {
    const actual = await pipe(
      makeEvent(['transform', [{ id: 'q2', name: 'nonExistentQuery', args: [] }]]),
      unit.core,
      Effect.runPromise
    );

    expect(actual.statusCode).toBe(200);
    expect(actual.body).toStrictEqual(
      expect.objectContaining({
        queries: [expect.objectContaining({ id: 'q2', name: 'nonExistentQuery', error: expect.anything() })],
      })
    );
  });
});
