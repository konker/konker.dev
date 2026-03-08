import { Schema } from 'effect';

export const ConfigSchema = Schema.Struct({
  better_auth: Schema.Struct({
    secret: Schema.String,
    base_url: Schema.String,

    base_path: Schema.String,
    secure_cookies: Schema.Boolean,
    cookie_samesite: Schema.Literal('strict', 'none', 'lax'),
    session_cookie_cache_max_age_seconds: Schema.Number,
    oidc_issuer: Schema.String,
    oidc_access_token_ttl_seconds: Schema.Number,
    oidc_id_token_ttl_seconds: Schema.Number,
    oidc_refresh_token_ttl_seconds: Schema.Number,
    oidc_code_ttl_seconds: Schema.Number,
    trusted_origins: Schema.String,
    password_token_expires_seconds: Schema.Number,
    // google_client_id: Schema.String,
    // google_client_secret: Schema.String,
    // apple_client_id: Schema.String,
    // apple_client_secret: Schema.String,
  }),
  aws_ecr: Schema.Struct({
    registry: Schema.String,
    repository: Schema.String,
  }),
  database: Schema.Struct({
    host: Schema.String,
    port: Schema.Number.pipe(Schema.int()),
    user: Schema.String,
    password: Schema.String,
    admin_user: Schema.String,
    admin_password: Schema.String,
    name: Schema.String,
    ssl: Schema.Unknown,
  }),
  otel: Schema.Struct({
    trace_exporter_url: Schema.String,
  }),
  brevo: Schema.Struct({
    api_url: Schema.String,
    api_key: Schema.String,
    sender: Schema.Struct({
      email: Schema.String,
      name: Schema.String,
    }),
  }),
  log: Schema.Struct({
    level: Schema.String,
  }),
});
