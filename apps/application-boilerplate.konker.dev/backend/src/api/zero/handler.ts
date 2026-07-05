/* eslint-disable fp/no-throw, fp/no-nil */
// Imperative glue to Zero's server handlers (async/await over postgres.js).
import { timingSafeEqual } from 'node:crypto';

import type { AuthData } from '@konker.dev/application-boilerplate.konker.dev-zerosync/auth';
import { queries } from '@konker.dev/application-boilerplate.konker.dev-zerosync/queries';
import { schema } from '@konker.dev/application-boilerplate.konker.dev-zerosync/schema';
import { mustGetMutator, mustGetQuery, type ReadonlyJSONValue } from '@rocicorp/zero';
import { handleMutateRequest, handleQueryRequest } from '@rocicorp/zero/server';
import type { Context } from 'hono';
import { jwtVerify } from 'jose';

import { getDbProvider } from '../../zero/db.js';
import { serverMutators } from '../../zero/server-mutators.js';

// --------------------------------------------------------------------------
// Service auth: Zero sends the configured query/mutate API key in `X-Api-Key`.
// Constant-time compare against ZERO_BACKEND_SERVICE_TOKEN proves the request
// came from the trusted zero-cache (not a client hitting the endpoint directly).
function isValidServiceKey(apiKey: string | undefined): boolean {
  const expected = process.env.ZERO_BACKEND_SERVICE_TOKEN;
  if (expected === undefined || expected === '' || apiKey === undefined) {
    return false;
  }
  const a = Buffer.from(apiKey);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// --------------------------------------------------------------------------
// User auth: zero-cache forwards the user's `Authorization: Bearer <jwt>` when
// the client is authenticated. Verify with the shared HS256 secret (same secret
// zero-cache verifies with via ZERO_AUTH_SECRET). Absent/invalid → anonymous.
function jwtVerificationConfig() {
  const signingSecret = process.env.JWT_SIGNING_SECRET;
  const issuer = process.env.JWT_ISSUER;
  if (signingSecret === undefined || signingSecret === '' || issuer === undefined || issuer === '') {
    throw new Error('JWT_SIGNING_SECRET/JWT_ISSUER is not set');
  }
  return { signingSecret, issuer };
}

async function verifyUser(authorization: string | undefined): Promise<AuthData | undefined> {
  if (authorization === undefined) {
    return undefined;
  }
  const token = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7) : authorization;
  const { issuer, signingSecret } = jwtVerificationConfig();
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(signingSecret), { issuer });
    return typeof payload.sub === 'string' ? { sub: payload.sub } : undefined;
  } catch {
    return undefined;
  }
}

// --------------------------------------------------------------------------
const UNAUTHORIZED = { error: 'unauthorized' } as const;

export async function zeroMutateHandler(c: Context): Promise<Response> {
  if (!isValidServiceKey(c.req.header('x-api-key'))) {
    return c.json(UNAUTHORIZED, 401);
  }
  const authData = await verifyUser(c.req.header('authorization'));
  const body = (await c.req.json()) as ReadonlyJSONValue;

  const response = await handleMutateRequest(
    getDbProvider(),
    async (transact) =>
      transact(async (tx, name, args) => {
        const mutator = mustGetMutator(serverMutators, name);
        return mutator.fn({ tx, args, ctx: authData });
      }),
    c.req.query(),
    body,
    'info'
  );
  return c.json(response);
}

export async function zeroQueryHandler(c: Context): Promise<Response> {
  if (!isValidServiceKey(c.req.header('x-api-key'))) {
    return c.json(UNAUTHORIZED, 401);
  }
  const authData = await verifyUser(c.req.header('authorization'));
  const body = (await c.req.json()) as ReadonlyJSONValue;

  const response = await handleQueryRequest(
    (name, args) => {
      const query = mustGetQuery(queries, name);
      return query.fn({ args, ctx: authData });
    },
    schema,
    body,
    'info'
  );
  return c.json(response);
}
