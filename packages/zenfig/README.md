# Zenfig

CLI tool for configuration and secrets management using AWS SSM (via Chamber), Jsonnet, and TypeBox.

## Prerequisites

- Node.js 18+ (or a compatible runtime)
- pnpm
- jsonnet CLI on PATH
- chamber CLI on PATH (required for the default `chamber` provider)
- AWS credentials if you use the `chamber` provider

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

Zenfig reads configuration from `.zenfigrc.json` (searches current and parent directories) and environment variables.

Example `.zenfigrc.json`:

```json
{
  "env": "dev",
  "provider": "chamber",
  "ssmPrefix": "/zenfig",
  "schema": "src/schema.ts",
  "schemaExportName": "ConfigSchema",
  "jsonnet": "config.jsonnet"
}
```

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
