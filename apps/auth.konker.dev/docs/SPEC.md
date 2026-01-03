# auth.konker.dev

Centralized authentication and authorization service for konker.dev applications.
Applications delegate authentication to auth.konker.dev via OIDC.

## Goals
- Provide a secure OIDC Identity Provider for konker.dev applications
- Offer a first-class user experience for account management
- Support progressive rollout: core auth first, then MFA, RBAC, external IDPs

## Non-goals (for initial release)
- Multi-tenant org management (can be added later)
- SCIM provisioning
- Custom enterprise SSO (SAML)

## Implementation constraints
- Use better-auth for core auth building blocks
- Backend: Hono
- Frontend: Solid
- Database: Postgres + Drizzle ORM
- Assume an existing Postgres database is available

## Architecture overview
- **Auth API** (Hono): user, session, token, and admin endpoints
- **OIDC Provider** (better-auth): authorization, token, userinfo, JWKS
- **Web UI** (Solid): sign-in, registration, recovery, account settings
- **Admin UI** (Solid): role assignment, audit log viewer
- **Email delivery**: transactional email for verification and recovery

## Core features
- User registration and profile management
- Email verification and password reset/recovery
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- External identity provider login (Google, GitHub)
- OIDC for app integration

## OIDC specification
### Flows
- Authorization Code + PKCE for browser apps
- Client Credentials for service-to-service (optional, see open decisions)
- Refresh tokens with rotation (see open decisions)

### Endpoints
- `/.well-known/openid-configuration`
- `/authorize`
- `/token`
- `/userinfo`
- `/jwks.json`
- `/logout` (front-channel)

### Scopes and claims
- Required scopes: `openid`, `profile`, `email`
- Optional scopes: `roles`, `groups`, `tenant` (future)
- Claims to include: `sub`, `email`, `email_verified`, `name`, `preferred_username`, `picture`
- Custom claim: `roles` (if RBAC enabled)

### Tokens
- Access token: JWT signed with rotating keys
- ID token: JWT signed with rotating keys
- Refresh token: opaque with rotation (if enabled)
- Token lifetimes: access 15m, id 15m, refresh 30d (defaults)

## Authentication flows
### Registration
- Collect email + password
- Verify email before enabling login
- Optional invite-only mode (see open decisions)

### Login
- Password + optional MFA
- Session persistence with device naming
- Support "remember this device" for MFA

### Password reset
- Email reset link with 15m TTL
- Invalidate existing sessions on reset

### Account recovery
- MFA recovery codes
- Admin reset (future)

## MFA
- TOTP as primary method
- Recovery codes generated at enrollment
- Optional WebAuthn (future)

## Authorization model (RBAC)
- Global roles (e.g., `admin`, `user`, `support`)
- Optional per-app role mappings (future)
- Role claims included in OIDC tokens

## External identity providers
- Google OAuth2
- GitHub OAuth2
- Account linking for existing users
- Conflict strategy: keep existing user, require explicit link

## Data model (minimum tables)
- `users` (id, email, status, created_at)
- `user_profiles` (user_id, name, avatar_url)
- `user_emails` (user_id, email, verified_at)
- `password_credentials` (user_id, hash, updated_at)
- `sessions` (user_id, token_id, created_at, expires_at, device_name)
- `oidc_clients` (client_id, client_secret_hash, redirect_uris, scopes)
- `oidc_tokens` (token_id, user_id, client_id, revoked_at)
- `mfa_factors` (user_id, type, secret, created_at)
- `mfa_recovery_codes` (user_id, code_hash, used_at)
- `roles`, `user_roles`
- `external_identities` (provider, provider_user_id, user_id)

## Security requirements
- Rate limiting on login, registration, password reset
- CSRF protection for session-based flows
- Secure cookies (HttpOnly, SameSite=Lax/Strict, Secure)
- Password policy (min length, common password check)
- Audit logging for auth events and admin actions

## UI requirements
### User UI
- Sign-in, sign-up, email verification, reset
- MFA enrollment and management
- Profile management
- Active sessions/devices list

### Admin UI
- User lookup
- Role assignment
- Audit log viewer

## Observability
- Structured logs (auth events, OIDC events)
- Metrics: login success rate, MFA adoption, reset frequency

## Deployment considerations
- Serverless-friendly: stateless API with DB-backed sessions
- Key rotation supported without downtime

## Phased delivery plan
1) Core auth: registration, email verification, password reset, sessions
2) OIDC provider: discovery, code flow, userinfo, JWKS
3) Admin UI: user lookup, role assignment
4) MFA: TOTP + recovery codes
5) External IDPs: Google, GitHub
6) RBAC claim enforcement across apps

## Open decisions (needs your input)
1) Client Credentials flow: enable for service-to-service auth, or skip?
2) Refresh tokens: enable rotation or rely on short-lived access tokens only?
3) Invite-only registration vs open registration?
4) Session storage: DB-backed sessions vs stateless JWT sessions?
5) MFA requirement: optional per-user vs enforced for privileged roles?
