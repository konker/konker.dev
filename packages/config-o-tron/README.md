# Config-o-tron

CLI tool for configuration and secrets management using AWS SSM with a pluggable validation layer (Effect Schema or Zod).

## Prerequisites

- Node.js 18+ (or a compatible runtime)
- pnpm
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

Config-o-tron reads configuration from `config-o-tronrc.json` or `config-o-tronrc.json5` (searches current and parent directories) and
environment variables. Both files are parsed with JSON5, so comments and trailing commas are allowed.
Validation is pluggable; set `validation` to `effect` (default) or `zod`. Your schema file must export a single
`ConfigSchema` value that matches the selected validator.

Example `config-o-tronrc.json`:

```json
{
  "env": "dev",
  "provider": "aws-ssm",
  "ssmPrefix": "/config-o-tron",
  "schema": "src/schema.ts",
  "validation": "effect",
  "providerGuards": {
    "aws-ssm": {
      "accountId": "123456789012",
      "region": "us-east-1"
    }
  }
}
```

Provider guards are provider-specific safety checks that run before any provider operation. They can be bypassed with
`CONFIG_O_TRON_IGNORE_PROVIDER_GUARDS=1` for emergencies.
For `aws-ssm`, `accountId` is resolved from `AWS_ACCOUNT_ID` or STS `GetCallerIdentity`, and `region` is resolved
from `AWS_REGION`/`AWS_DEFAULT_REGION` or the AWS SDK client configuration.

Environment overrides:

- `CONFIG_O_TRON_ENV`
- `CONFIG_O_TRON_PROVIDER`
- `CONFIG_O_TRON_SSM_PREFIX`
- `CONFIG_O_TRON_SCHEMA`
- `CONFIG_O_TRON_VALIDATION`
- `CONFIG_O_TRON_FORMAT`
- `CONFIG_O_TRON_SEPARATOR`
- `CONFIG_O_TRON_CACHE`
- `CONFIG_O_TRON_CI`
- `CONFIG_O_TRON_IGNORE_PROVIDER_GUARDS`

## Run

Show CLI help:

```sh
pnpm run config-o-tron -- --help
```

List keys for a service:

```sh
pnpm run config-o-tron list <service>
```

Export config for a service:

```sh
pnpm run config-o-tron export <service>
```

Use a different provider:

```sh
CONFIG_O_TRON_PROVIDER=mock pnpm run config-o-tron list <service>
```

## Programmatic API (export-only)

Config-o-tron exposes a TypeScript API for export-only usage. It resolves configuration the same way as the CLI (rc file,
env vars, defaults), but lets you override values inline.

```ts
import { exportConfig } from '@konker.dev/config-o-tron';

const result = await exportConfig({
  service: 'api',
  sources: ['shared'],
  format: 'json',
  config: {
    env: 'prod',
    provider: 'aws-ssm',
    ssmPrefix: '/config-o-tron',
    schema: 'src/schema.ts',
    validation: 'effect',
  },
});

// Structured config object
console.log(result.config);
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
