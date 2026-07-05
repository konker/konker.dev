/* eslint-disable fp/no-throw, fp/no-nil */
/**
 * Auth context carried by Zero synced queries and custom mutators.
 *
 * For this boilerplate the JWT is minted out-of-band (see backend
 * `scripts/MintDevJwt.ts`) and verified with a shared HS256 secret both by
 * zero-cache (`ZERO_AUTH_SECRET`) and the backend query/mutate endpoints.
 */
export type AuthData = {
  readonly sub: string;
};

/**
 * Narrow an optional auth context to a logged-in user, throwing otherwise.
 * Used by mutators (and may be used by queries) to enforce authentication.
 */
export function assertIsLoggedIn(ctx: AuthData | undefined): asserts ctx is AuthData {
  if (ctx === undefined || typeof ctx.sub !== 'string' || ctx.sub.length === 0) {
    throw new Error('Not authenticated');
  }
}
