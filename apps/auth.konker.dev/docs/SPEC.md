# auth.konker.dev

This is a specification for a centralized authentication and authorization service which will act as an IDP for various other konker.dev applications.
The goal is that a konker.dev application can delegate to auth.konker.dev via OIDC for authentication.

## Requirements

- User registration and profile management
- Password reset and recovery
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- Integration with existing identity providers (e.g., Google, GitHub)
- Support for OpenID Connect (OIDC) for seamless integration with konker.dev applications

## Notes
- Implementation should be based on better-auth.com
- Implementation should use hono for backend components
- Implementation should use Solid for front-end
  - Pros/cons to be explored
- Implementation should be based on postgres and drizzle orm
  - The spec should assume that an existing postgres database is available
- If possible, a serverless deployment for the backend should be considered.
  - The spec should be concerned with architecture and detailed specification of the required front-end and backend components, and less focussed on how this will be deployed.
- The specification should provide a path for implementation starting with the most fundamental authentication components. Further step will allow adding MFA, RBAC, external IDPs, etc.

