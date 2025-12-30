# Zenfig

CLI tool for configuration and secrets management using AWS SSM, Jsonnet, and TypeBox.

## Prerequisites

- Node.js 18+ (or a compatible runtime)
- pnpm
- jsonnet CLI on PATH
- AWS credentials and region configuration for the default `aws-ssm` provider

## Setup

Install dependencies:

```sh
pnpm install
```

Build the CLI:

```sh
pnpm run build
```

## Configure

Zenfig reads configuration from `zenfigrc.json` or `zenfigrc.json5` (searches current and parent directories) and
environment variables. Both files are parsed with JSON5, so comments and trailing commas are allowed.

Example `zenfigrc.json`:

```json
{
  "env": "dev",
  "provider": "aws-ssm",
  "ssmPrefix": "/zenfig",
  "schema": "src/schema.ts",
  "schemaExportName": "ConfigSchema",
  "jsonnet": "config.jsonnet",
  "providerGuards": {
    "aws-ssm": {
      "accountId": "123456789012",
      "region": "us-east-1"
    }
  }
}
```

Provider guards are provider-specific safety checks that run before any provider operation. They can be bypassed with
`ZENFIG_IGNORE_PROVIDER_GUARDS=1` for emergencies.
For `aws-ssm`, `accountId` is resolved from `AWS_ACCOUNT_ID` or STS `GetCallerIdentity`, and `region` is resolved
from `AWS_REGION`/`AWS_DEFAULT_REGION` or the AWS SDK client configuration.

Environment overrides:

- `ZENFIG_ENV`
- `ZENFIG_PROVIDER`
- `ZENFIG_SSM_PREFIX`
- `ZENFIG_SCHEMA`
- `ZENFIG_SCHEMA_EXPORT_NAME`
- `ZENFIG_JSONNET`
- `ZENFIG_FORMAT`
- `ZENFIG_SEPARATOR`
- `ZENFIG_CACHE`
- `ZENFIG_JSONNET_TIMEOUT_MS`
- `ZENFIG_CI`
- `ZENFIG_IGNORE_PROVIDER_GUARDS`

## Run

Show CLI help:

```sh
pnpm run zenfig -- --help
```

List keys for a service:

```sh
pnpm run zenfig list <service>
```

Export config for a service:

```sh
pnpm run zenfig export <service>
```

Use a different provider:

```sh
ZENFIG_PROVIDER=mock pnpm run zenfig list <service>
```

## Development

Run tests:

```sh
pnpm run test
```

Lint:

```sh
pnpm run lint-check
```
