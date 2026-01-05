# Better Auth setup for auth.konker.dev

This document describes how to configure better-auth so it matches the API and behavior in
`docs/auth-api-spec.md` and `docs/SPEC.md`. It focuses on server-side setup (Hono + Postgres
+ Drizzle), required schema, and plugins.

## Table of contents
- [Goals](#goals)
- [Prerequisites](#prerequisites)
- [Install dependencies](#install-dependencies)
- [Database schema](#database-schema)
- [Core better-auth configuration](#core-better-auth-configuration)
- [Plugin configuration](#plugin-configuration)
- [OIDC provider setup](#oidc-provider-setup)
- [Per-client registration policy](#per-client-registration-policy)
- [Custom invite system (outside better-auth)](#custom-invite-system-outside-better-auth)
- [Hono integration pattern](#hono-integration-pattern)
- [Decisions selected](#decisions-selected)

## Goals
- Align better-auth endpoints and payloads with `/api/auth/*` routes.
- Enable the OIDC provider under `/oidc/*` with per-client policy controls.
- Support MFA, admin actions, and session management as described in the spec.

## Prerequisites
- Postgres available and reachable.
- Drizzle ORM configured with your connection.
- Hono app initialized.

## Install dependencies
- better-auth (server)
- better-auth client (for UI integration)
- better-auth plugins: admin, twoFactor
- Drizzle adapter for better-auth

## Database schema
Use the Better Auth CLI to generate or migrate the schema, then extend it to match the
minimum tables in `docs/SPEC.md`.

Key entities to include:
- User + profile + emails + credentials
- Sessions and token storage
- OIDC clients and tokens
- MFA factors + recovery codes
- Roles and role assignments
- External identities
- Custom invite table for per-client invite-only registration

Note: if your better-auth version requires explicit plugin tables (admin, twoFactor),
run the CLI migration for those plugins.

## Core better-auth configuration
Create a single `auth` instance and mount it in Hono.

Required config (conceptual):
- Base path: `/api/auth`
- Adapter: Drizzle Postgres adapter
- Email/password enabled
- Email verification + password reset enabled
- Cookie options: secure, HttpOnly, SameSite
- Session strategy: cookie cache enabled with `jwt` strategy
- OIDC provider enabled at `/oidc` with issuer `https://auth.konker.dev/oidc`
- Token lifetimes and refresh rotation per client (rotation enabled by default for new clients)
- Audit hooks for sign-in, 2FA, password reset, role changes

## Plugin configuration
### Admin plugin
- Enable the admin plugin.
- Use default admin role only.

### Two-factor plugin
- Enable the twoFactor plugin.
- Configure issuer (app name) and enable OTP-based 2FA (email/SMS) in addition to TOTP.

### Optional: multi-session
If your better-auth version requires the multi-session plugin for list/revoke session
endpoints, enable it and configure max sessions.

## OIDC provider setup
Configure the OIDC provider with:
- Issuer: `https://auth.konker.dev/oidc`
- Client registry (per-client redirect URIs, scopes, type, refresh rotation)
- Key material and rotation: rotate every 90 days, keep keys for 180 days
- Supported scopes (`openid`, `profile`, `email`, optional `roles`)
- Logout settings and registered post-logout redirect URIs

Ensure refresh token rotation is configurable per client.

## Per-client registration policy
Enforce client policy in Hono before calling better-auth:
- `open`: allow sign-up
- `invite-only`: require invite token bound to `client_id`
- `closed`: block self-registration

Client context is required for sign-up and sign-in. If no `client_id` can be inferred from
an active OIDC flow, reject the request (context-only policy).

## Custom invite system (outside better-auth)
Implement a custom invite table and endpoints:
- Issue invite (admin-only), store hashed token, set expiry
- List invites (admin-only)
- Revoke invites (admin-only)
- Accept invite -> call `auth.api.signUpEmail` with provided credentials
- Default invite TTL: 7 days

## Hono integration pattern
- Build `Headers` from `c.req.headers` and pass into `auth.api.*` calls.
- Use `returnHeaders: true` where cookies are set/cleared, forward `set-cookie`.
- Use `body` for JSON and `query` for query params.

## Decisions selected
1) Session strategy: `jwt` cookie cache strategy.
2) Admin access control: default admin role only.
3) OIDC key rotation: 90-day rotation cadence with 180-day key retention window.
4) Refresh token rotation default: enabled for new clients.
5) Invite TTL default: 7 days.
6) MFA enforcement: `admin` role.
7) OTP-based 2FA: enable both email/SMS OTP and TOTP.
