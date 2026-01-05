# auth.konker.dev Hono Auth API

This document defines the HTTP API blueprint for the Hono-based auth service described in `docs/SPEC.md`.
It covers the auth API under `/api/auth` and the OIDC provider under `/oidc`. OIDC endpoints are
implemented by better-auth and documented here for integration clarity.

## Table of contents
- [Scope](#scope)
- [Base URL and versioning](#base-url-and-versioning)
- [Applications vs organizations](#applications-vs-organizations)
- [Conventions](#conventions)
- [better-auth integration guidance](#better-auth-integration-guidance)
- [Auth and session model](#auth-and-session-model)
- [Client access policy (per OAuth client)](#client-access-policy-per-oauth-client)
- [Invite issuance and lifecycle](#invite-issuance-and-lifecycle)
- [Rate limiting and abuse controls](#rate-limiting-and-abuse-controls)
- [Endpoints](#endpoints)
- [Mermaid diagrams](#mermaid-diagrams)

## Scope
- Public auth endpoints (email/password sign-up, sign-in, sign-out)
- Session access (get session)
- Password reset and change password
- MFA via better-auth two-factor plugin (TOTP + backup codes)
- Invite-only registration support (custom)
- Admin endpoints (better-auth admin plugin)
- OIDC provider endpoints (prefixed `/oidc`)

## Base URL and versioning
- Base path: `/api/auth`
- Versioning: not applied. Use a new base path if a breaking change is required.

## Applications vs organizations
- OAuth/OIDC clients represent separate applications. They define redirect URIs, scopes, and per-client policy.
- better-auth organizations model tenant/workspace membership within an application, not application segregation.
- Invite-only access is enforced per client (app), not via organizations. Invites are bound to a `client_id`.

## Conventions
- Content-Type: `application/json` unless the endpoint is OIDC (`application/x-www-form-urlencoded` on `/oidc/token`).
- All timestamps are ISO 8601 UTC strings.
- For endpoints backed by better-auth, use better-auth request/response and error formats without
  wrapping or renaming fields.
- Custom endpoints must follow the same field naming conventions and error format as better-auth.

## better-auth integration guidance
Use better-auth to provide core auth behavior; Hono hosts the HTTP surface and adds app-specific
features (invites, admin, auditing).

Recommended integration steps:
1) Initialize better-auth with a Drizzle Postgres adapter and the same user schema defined in
   `docs/SPEC.md`.
2) Set `basePath` to `/api/auth` (default) unless a different mount point is required.
3) Enable email/password, email verification, and password reset flows; wire email delivery via
   a provider adapter (SMTP or API).
4) Configure session and cookie options (cookie prefix, secure cookies, stateless cookie cache as needed).
5) Mount better-auth handlers under `/api/auth/*` and `/oidc/*` inside Hono routes.
6) Use better-auth events/hooks (or Hono middleware) to emit audit logs for login, MFA, password
   reset, role changes, and email verification.
7) Implement custom endpoints not provided by better-auth (invites) using the same DB/Drizzle layer.
8) Enforce per-client access policies (open/invite-only/closed) in Hono before calling better-auth.
   Do not use the better-auth organization plugin to segregate apps.

Hono handler pattern:
- Use `c.req.headers` to build a `Headers` object for `auth.api` calls so better-auth can read cookies,
  IP, and user agent if needed.
- For endpoints that set or clear cookies, call the API with `returnHeaders: true` and forward the
  `set-cookie` value(s) to the Hono response.
- Use `body` for JSON payloads and `query` for query params when calling `auth.api`.
- Consider `asResponse: true` if you want better-auth to return a raw `Response` (for example, to
  mirror status codes exactly).

Mapping guidance:
- Sign-up/sign-in/sign-out, session access, password reset, email verification, two-factor: use
  better-auth built-ins and keep request/response formats unchanged.
- Hono may set cookies or headers, but must not remap payloads.
- OIDC endpoints: use better-auth OIDC provider mounted under `/oidc`.

## Auth and session model
- Better-auth uses cookie-based sessions by default.
- Cookie names are prefixed: `${prefix}.${cookie_name}` with default prefix `better-auth`.
- Default cookies include `session_token`, `session_data` (when cookie cache is enabled), and
  `dont_remember` (when `rememberMe` is disabled).
- Two-factor plugin uses a `two_factor` cookie to track 2FA state.
- Stateless sessions are supported via cookie cache strategies (`compact`, `jwt`, `jwe`).

## Client access policy (per OAuth client)
- Each OAuth client has a registration mode: `open`, `invite-only`, or `closed`.
- Invite-only clients require a valid invite token bound to the `client_id`.
- Closed clients only allow pre-provisioned users (no self-registration).
- Client policy is checked by Hono before delegating to better-auth; request payloads remain unchanged.
- The Web UI can pass `client_id` as an optional query parameter on sign-up/sign-in to set policy context.
- If `client_id` is not provided, Hono must infer it from an active OIDC authorization flow. If no
  client context exists, sign-up and sign-in are rejected.

## Invite issuance and lifecycle
- Invites are issued by admins and are scoped to a `client_id` (and optionally an email).
- Invite tokens are random, single-use secrets. Store only a secure hash in the database.
- An invite is valid when: not expired, not revoked, not accepted, and (if bound) email matches.
- Acceptance marks `acceptedAt` and binds the created user to the invite for auditability.
- Use short TTLs by default (for example 7-14 days), with optional per-invite overrides.

## Rate limiting and abuse controls
- Apply IP + identifier rate limits on:
  - `POST /api/auth/sign-in/email`
  - `POST /api/auth/sign-up/email`
  - `POST /api/auth/request-password-reset`

## Endpoints

### Auth API endpoints (`/api/auth`)

#### better-auth pass-through endpoints
These routes are exposed as-is from better-auth. Request/response payloads and error formats must
match better-auth defaults without wrapping or renaming fields.

##### Email/password
###### `POST /sign-up/email`
| Field | Details |
| --- | --- |
| Body | `name`, `email`, `password`, optional `image`, optional `callbackURL` |
| Better-auth call | `auth.api.signUpEmail({ body, headers, returnHeaders: true })` |
| Cookie handling | Forward `set-cookie` headers from the returned headers object |

###### `POST /sign-in/email`
| Field | Details |
| --- | --- |
| Body | `email`, `password`, optional `rememberMe` (default `true`), optional `callbackURL` |
| Notes | If 2FA is enabled, response includes `twoFactorRedirect: true` |
| Better-auth call | `auth.api.signInEmail({ body, headers, returnHeaders: true })` |
| Cookie handling | Forward `set-cookie` headers from the returned headers object |

###### `POST /sign-out`
| Field | Details |
| --- | --- |
| Body | None |
| Better-auth call | `auth.api.signOut({ headers, returnHeaders: true })` |
| Cookie handling | Forward `set-cookie` headers from the returned headers object |

##### User profile
###### `POST /update-user`
| Field | Details |
| --- | --- |
| Body | `name`, `image`, plus any additional user fields configured in better-auth |
| Better-auth call | `auth.api.updateUser({ body, headers, returnHeaders: true })` |
| Cookie handling | Forward `set-cookie` headers if returned |

##### Session access
###### `GET /get-session`
| Field | Details |
| --- | --- |
| Query | Optional `disableCookieCache` (boolean) |
| Better-auth call | `auth.api.getSession({ headers, query })` |

###### `GET /list-sessions`
| Field | Details |
| --- | --- |
| Response | Returns active sessions for the current user |
| Better-auth call | `auth.api.listSessions({ headers })` |

###### `POST /revoke-session`
| Field | Details |
| --- | --- |
| Body | `token` |
| Better-auth call | `auth.api.revokeSession({ body, headers })` |

###### `POST /revoke-sessions`
| Field | Details |
| --- | --- |
| Response | Revokes all sessions for the current user |
| Better-auth call | `auth.api.revokeSessions({ headers })` |

###### `POST /revoke-other-sessions`
| Field | Details |
| --- | --- |
| Response | Revokes all sessions except the current one |
| Better-auth call | `auth.api.revokeOtherSessions({ headers })` |

##### Password reset and change password
###### `POST /request-password-reset`
| Field | Details |
| --- | --- |
| Body | `email`, optional `redirectTo` |
| Better-auth call | `auth.api.requestPasswordReset({ body, headers })` |

###### `POST /reset-password`
| Field | Details |
| --- | --- |
| Body | `newPassword`, `token` |
| Better-auth call | `auth.api.resetPassword({ body, headers })` |

###### `POST /change-password`
| Field | Details |
| --- | --- |
| Body | `newPassword`, `currentPassword`, optional `revokeOtherSessions` |
| Better-auth call | `auth.api.changePassword({ body, headers })` |

##### Email verification
###### `POST /send-verification-email`
| Field | Details |
| --- | --- |
| Body | `email`, optional `callbackURL` |
| Better-auth call | `auth.api.sendVerificationEmail({ body, headers })` |

###### `GET /verify-email`
| Field | Details |
| --- | --- |
| Query | `token`, optional `callbackURL` |
| Better-auth call | `auth.api.verifyEmail({ query, headers, returnHeaders: true })` |
| Cookie handling | Forward `set-cookie` headers if returned |

##### Two-factor (better-auth two-factor plugin)
###### `POST /two-factor/enable`
| Field | Details |
| --- | --- |
| Body | `password`, optional `issuer` |
| Better-auth call | `auth.api.twoFactorEnable({ body, headers, returnHeaders: true })` |

###### `POST /two-factor/get-totp-uri`
| Field | Details |
| --- | --- |
| Body | `password` |
| Better-auth call | `auth.api.twoFactorGetTotpUri({ body, headers })` |

###### `POST /two-factor/verify-totp`
| Field | Details |
| --- | --- |
| Body | `code`, optional `trustDevice` |
| Better-auth call | `auth.api.twoFactorVerifyTotp({ body, headers, returnHeaders: true })` |
| Cookie handling | Forward `set-cookie` headers from the returned headers object |

###### `POST /two-factor/generate-backup-codes`
| Field | Details |
| --- | --- |
| Body | `password` |
| Better-auth call | `auth.api.twoFactorGenerateBackupCodes({ body, headers })` |

###### `POST /two-factor/verify-backup-code`
| Field | Details |
| --- | --- |
| Body | `code`, optional `disableSession`, optional `trustDevice` |
| Better-auth call | `auth.api.twoFactorVerifyBackupCode({ body, headers, returnHeaders: true })` |
| Cookie handling | Forward `set-cookie` headers if returned |

###### `POST /two-factor/disable`
| Field | Details |
| --- | --- |
| Body | `password` |
| Better-auth call | `auth.api.twoFactorDisable({ body, headers })` |

##### Optional OTP-based 2FA endpoints (if configured)
###### `POST /two-factor/send-otp`
| Field | Details |
| --- | --- |
| Body | Optional `trustDevice` |
| Better-auth call | `auth.api.twoFactorSendOtp({ body, headers })` |

###### `POST /two-factor/verify-otp`
| Field | Details |
| --- | --- |
| Body | `code`, optional `trustDevice` |
| Better-auth call | `auth.api.twoFactorVerifyOtp({ body, headers, returnHeaders: true })` |
| Cookie handling | Forward `set-cookie` headers if returned |

#### Custom endpoints

##### POST `/invites/create`
Creates an invite for a specific OAuth client (admin-only).

Request:
```json
{
  "clientId": "client-id",
  "email": "user@example.com",
  "expiresIn": 1209600
}
```

Response:
```json
{
  "inviteId": "invite-id",
  "clientId": "client-id",
  "email": "user@example.com",
  "inviteToken": "invite-token",
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

##### GET `/invites/list`
Lists invites for a given client (admin-only).

Query:
| Parameter | Required | Details |
| --- | --- | --- |
| `clientId` | Yes | Client to list invites for |
| `status` | No | `pending`, `accepted`, `revoked`, `expired` |
| `limit` | No | Default `50` |
| `offset` | No | Default `0` |

Response:
```json
{
  "invites": [
    {
      "inviteId": "invite-id",
      "clientId": "client-id",
      "email": "user@example.com",
      "invitedBy": "user-id",
      "createdAt": "2024-01-01T00:00:00Z",
      "status": "pending",
      "expiresAt": "2025-01-01T00:00:00Z",
      "acceptedAt": null,
      "revokedAt": null
    }
  ]
}
```

##### POST `/invites/revoke`
Revokes a pending invite (admin-only).

Request:
```json
{
  "inviteId": "invite-id"
}
```

Response:
```json
{
  "success": true
}
```

##### POST `/invites/accept`
Accepts an invite and creates the user using better-auth registration under the hood.
The invite token is bound to a `client_id` (and optionally an email). This endpoint is the entry
point for invite-only clients.

Request:
```json
{
  "inviteToken": "invite-token",
  "email": "user@example.com",
  "password": "string",
  "name": "Name"
}
```

Response: `201`

##### Admin plugin session endpoints (better-auth admin plugin)
These endpoints are available only when the better-auth admin plugin is enabled.

###### `POST /admin/list-user-sessions`
| Field | Details |
| --- | --- |
| Body | `userId` |
| Response | `{ sessions: Session[] }` |
| Better-auth call | `auth.api.listUserSessions({ body, headers })` |

###### `POST /admin/revoke-user-session`
| Field | Details |
| --- | --- |
| Body | `sessionToken` |
| Response | `{ success: boolean }` |
| Better-auth call | `auth.api.revokeUserSession({ body, headers })` |

###### `POST /admin/revoke-user-sessions`
| Field | Details |
| --- | --- |
| Body | `userId` |
| Response | `{ success: boolean }` |
| Better-auth call | `auth.api.revokeUserSessions({ body, headers })` |

##### Admin plugin user endpoints (better-auth admin plugin)
###### `POST /admin/create-user`
| Field | Details |
| --- | --- |
| Body | `email`, `password`, `name`, optional `role`, optional `data` |
| Better-auth call | `auth.api.createUser({ body, headers })` |

###### `GET /admin/get-user`
| Field | Details |
| --- | --- |
| Query | `id` |
| Better-auth call | `auth.api.getUser({ query, headers })` |

###### `POST /admin/update-user`
| Field | Details |
| --- | --- |
| Body | `userId`, `data` |
| Better-auth call | `auth.api.adminUpdateUser({ body, headers })` |

###### `GET /admin/list-users`
| Field | Details |
| --- | --- |
| Query | `searchValue`, `searchField`, `searchOperator`, `limit`, `offset`, `sortBy`, `sortDirection`, `filterField`, `filterValue`, `filterOperator` |
| Better-auth call | `auth.api.listUsers({ query, headers })` |

###### `POST /admin/set-role`
| Field | Details |
| --- | --- |
| Body | `userId`, `role` |
| Better-auth call | `auth.api.setRole({ body, headers })` |

###### `POST /admin/set-user-password`
| Field | Details |
| --- | --- |
| Body | `userId`, `newPassword` |
| Better-auth call | `auth.api.setUserPassword({ body, headers })` |

###### `POST /admin/ban-user`
| Field | Details |
| --- | --- |
| Body | `userId`, optional `banReason`, optional `banExpiresIn` |
| Better-auth call | `auth.api.banUser({ body, headers })` |

###### `POST /admin/unban-user`
| Field | Details |
| --- | --- |
| Body | `userId` |
| Better-auth call | `auth.api.unbanUser({ body, headers })` |

###### `POST /admin/remove-user`
| Field | Details |
| --- | --- |
| Body | `userId` |
| Better-auth call | `auth.api.removeUser({ body, headers })` |

###### `POST /admin/impersonate-user`
| Field | Details |
| --- | --- |
| Body | `userId` |
| Better-auth call | `auth.api.impersonateUser({ body, headers, returnHeaders: true })` |
| Cookie handling | Forward `set-cookie` headers from the returned headers object |

###### `POST /admin/stop-impersonating`
| Field | Details |
| --- | --- |
| Body | None |
| Better-auth call | `auth.api.stopImpersonating({ headers, returnHeaders: true })` |
| Cookie handling | Forward `set-cookie` headers if returned |

###### `POST /admin/has-permission`
| Field | Details |
| --- | --- |
| Body | `permissions` (or deprecated `permission`), optional `userId`, optional `role` |
| Better-auth call | `auth.api.userHasPermission({ body, headers })` |

### OIDC provider endpoints (`/oidc`)

#### Base URL
- Issuer: `https://auth.konker.dev/oidc`
- OIDC endpoints are mounted under `/oidc`

#### Supported flows
- Authorization Code + PKCE (required for browser clients)
- Refresh token grant (optional per client)
- Client Credentials flow is out of scope for this project

#### Client types
- Public clients: require PKCE; no client secret
- Confidential clients: client secret required for token exchange
- Redirect URIs must be pre-registered and matched exactly

#### Discovery
| Endpoint | Details |
| --- | --- |
| `/oidc/.well-known/openid-configuration` | Exposes issuer, endpoints, supported scopes, and signing algorithms |

#### Endpoints
| Endpoint | Details |
| --- | --- |
| `GET /oidc/authorize` | Authorization endpoint |
| `POST /oidc/token` | Token endpoint |
| `GET /oidc/userinfo` | Userinfo endpoint |
| `GET /oidc/jwks.json` | JWKS endpoint |
| `GET /oidc/logout` | Front-channel logout |

#### Scopes and claims
- Required scopes: `openid`, `profile`, `email`
- Optional scopes: `roles`
- Standard claims: `sub`, `email`, `email_verified`, `name`, `preferred_username`, `picture`
- Custom claims: `roles` (array of strings)

#### Tokens
- Access token: JWT signed with rotating keys (JWS)
- ID token: JWT signed with rotating keys (JWS)
- Refresh token: opaque with rotation (configurable per client)
- Default lifetimes: access 15m, ID 15m, refresh 30d

#### Logout
| Field | Details |
| --- | --- |
| Endpoint | Front-channel logout via `GET /oidc/logout` |
| Parameters | `id_token_hint`, optional `post_logout_redirect_uri`, `state` |
| Redirects | Redirect URIs must be pre-registered per client |

#### Error handling
- Use standard OIDC error responses (`invalid_request`, `invalid_client`, `invalid_grant`, etc.)
- Include `error` and `error_description` in JSON for token/userinfo responses

## Mermaid diagrams

### Login with MFA (TOTP)
```mermaid
sequenceDiagram
  participant U as User
  participant UI as Web UI (Solid)
  participant API as Hono Auth API

  U->>UI: Enter email/password
  UI->>API: POST /api/auth/sign-in/email
  API-->>UI: twoFactorRedirect: true
  U->>UI: Enter TOTP code
  UI->>API: POST /api/auth/two-factor/verify-totp
  API-->>UI: Session cookie set
```

### Password reset
```mermaid
sequenceDiagram
  participant U as User
  participant UI as Web UI (Solid)
  participant API as Hono Auth API
  participant Email as Email Provider

  U->>UI: Request reset
  UI->>API: POST /api/auth/request-password-reset
  API-->>Email: Send reset link
  Email-->>U: Reset email
  U->>UI: Open reset link
  UI->>API: POST /api/auth/reset-password
  API-->>UI: 200 OK
```

### Sign out
```mermaid
sequenceDiagram
  participant U as User
  participant API as Hono Auth API

  U->>API: POST /api/auth/sign-out
  API-->>U: 200 OK
```

### Authorization Code + PKCE
```mermaid
sequenceDiagram
  participant U as User
  participant C as Client App
  participant OP as OIDC Provider

  U->>C: Click "Sign in"
  C->>OP: GET /oidc/authorize (code_challenge, state)
  OP-->>U: Login + consent
  OP-->>C: Redirect with code + state
  C->>OP: POST /oidc/token (code_verifier)
  OP-->>C: access_token + id_token
  C->>OP: GET /oidc/userinfo (Bearer access_token)
  OP-->>C: user claims
```
