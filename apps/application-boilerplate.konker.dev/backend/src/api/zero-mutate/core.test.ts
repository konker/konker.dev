import type { RequestW } from '@konker.dev/middleware-fp/http';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { Effect, pipe } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDbProvider } from '../../zero/db.js';
import * as unit from './core.js';
import type { CoreEvent } from './handler.js';

// The mutate core delegates the actual database work to zero's handleMutateRequest
// over a postgres.js provider. Mock that seam so the test can drive the app's
// mutator wiring (mustGetMutator + serverMutators) against a fake transaction
// without a live database.
const FAKE_DB_PROVIDER = { __fake: 'db-provider' };
vi.mock('../../zero/db.js', () => ({
  getDbProvider: vi.fn(() => FAKE_DB_PROVIDER),
}));
vi.mock('@rocicorp/zero/server', () => ({
  handleMutateRequest: vi.fn(),
}));

// The middleware stack (jsonBodyParserRequest) normally parses the request body
// into a JSON value and jwtAuthenticator sets a guaranteed-string userId; here we
// construct that post-middleware shape directly.
function makeEvent(body: unknown, userId = 'test-user-123'): RequestW<CoreEvent> {
  return {
    url: '/zero/mutate',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // The custom-mutate endpoint requires these query params (schema + appID).
    queryStringParameters: { schema: 'application-boilerplate', appID: 'application-boilerplate' },
    pathParameters: {},
    userId,
    body,
    validatedEnv: {},
  } as unknown as RequestW<CoreEvent>;
}

// A representative push body; its exact shape is irrelevant here because
// handleMutateRequest is mocked — the core just forwards it verbatim.
const PUSH_BODY = {
  clientGroupID: 'test-client-group',
  mutations: [{ name: 'widget.create', args: { id: 'w1', name: 'Widget One', size: 3 } }],
  pushVersion: 1,
  timestamp: 1_700_000_000_000,
  requestID: 'test-request-id',
};

describe('zero-mutate/core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs each mutation through its server mutator and wraps the response', async () => {
    const insert = vi.fn();
    const tx = { mutate: { widgets: { insert } } };

    // Simulate zero invoking our handler: run the transact callback once for a
    // `widget.create` mutation, then return a MutateResponse.
    vi.mocked(handleMutateRequest).mockImplementation((async (input: any) => {
      await input.handler(async (cb: any) => {
        await cb(tx, 'widget.create', { id: 'w1', name: 'Widget One', size: 3 });
        return { id: 'm1' };
      }, {});
      return { kind: 'MutateResponse', mutations: [{ id: 'm1' }], userID: input.userID };
    }) as never);

    const actual = await pipe(makeEvent(PUSH_BODY, 'user-1'), unit.core, Effect.runPromise);

    expect(actual).toStrictEqual({
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: { kind: 'MutateResponse', mutations: [{ id: 'm1' }], userID: 'user-1' },
    });
    // The real `widget.create` server mutator ran against the fake transaction.
    expect(insert).toHaveBeenCalledWith({ id: 'w1', name: 'Widget One', size: 3 });
  });

  it('forwards the db provider, query params, body, and authenticated userID', async () => {
    vi.mocked(handleMutateRequest).mockResolvedValue({ kind: 'MutateResponse', mutations: [] } as never);

    await pipe(makeEvent(PUSH_BODY, 'user-xyz'), unit.core, Effect.runPromise);

    expect(getDbProvider).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(handleMutateRequest).mock.calls.at(-1)?.[0] as unknown as Record<string, unknown>;
    expect(arg.dbProvider).toBe(FAKE_DB_PROVIDER);
    expect(arg.query).toStrictEqual({ schema: 'application-boilerplate', appID: 'application-boilerplate' });
    expect(arg.body).toBe(PUSH_BODY);
    expect(arg.userID).toBe('user-xyz');
    expect(arg.logLevel).toBe('info');
  });
});
