# Specification: Zenfig Configuration & Secrets Management Tool

<!-- TOC -->

- [Specification: Zenfig Configuration & Secrets Management Tool](#specification-zenfig-configuration--secrets-management-tool)
  - [1. Goal](#1-goal)
  - [2. Technical Stack](#2-technical-stack)
  - [3. Core Workflow](#3-core-workflow)
    - [Core Concepts (Layers, Paths, and Values)](#core-concepts-layers-paths-and-values)
    - [A. Export Workflow (Fetch -> Parse + Merge -> Validate -> Output)](#a-export-workflow-fetch---parse--merge---validate---output)
    - [B. Upsert Workflow (Input -> Validate -> Push)](#b-upsert-workflow-input---validate---push)
    - [C. Validate Workflow (Input -> Parse -> Validate)](#c-validate-workflow-input---parse---validate)
    - [D. Delete Workflow (Input -> Validate -> Confirm -> Remove)](#d-delete-workflow-input---validate---confirm---remove)
    - [E. Snapshot Workflow](#e-snapshot-workflow)
      - [Save (Fetch Stored -> Validate -> Store)](#save-fetch-stored---validate---store)
      - [Restore (Load -> Validate -> Diff -> Confirm -> Push)](#restore-load---validate---diff---confirm---push)
      - [Snapshot File Format (v1)](#snapshot-file-format-v1)
  - [4. Provider Model (Pluggable)](#4-provider-model-pluggable)
    - [Provider Interface](#provider-interface)
    - [Default Provider: AWS SSM (`aws-ssm`)](#default-provider-aws-ssm-aws-ssm)
    - [Provider Registry](#provider-registry)
    - [Encryption Verification](#encryption-verification)
  - [5. Validator Model (Pluggable)](#5-validator-model-pluggable)
    - [Validator Selection](#validator-selection)
    - [Validator Interface](#validator-interface)
    - [Schema Export Conventions](#schema-export-conventions)
    - [Error Normalization](#error-normalization)
  - [6. Configuration Contract](#6-configuration-contract)
    - [Merged Config Input](#merged-config-input)
    - [Output](#output)
  - [7. SSM Naming Convention](#7-ssm-naming-convention)
  - [8. Multi-Source Composition](#8-multi-source-composition)
    - [CLI Input](#cli-input)
    - [Merge Semantics](#merge-semantics)
    - [Merge Conflict Behavior](#merge-conflict-behavior)
  - [9. Implementation Requirements](#9-implementation-requirements)
    - [Implementation Conventions](#implementation-conventions)
    - [Project Structure](#project-structure)
    - [CLI Interface](#cli-interface)
      - [Core Commands](#core-commands)
      - [Examples](#examples)
    - [Programmatic API (TypeScript)](#programmatic-api-typescript)
    - [Environment Variable Precedence](#environment-variable-precedence)
    - [Config File (`zenfigrc.json` / `zenfigrc.json5`)](#config-file-zenfigrcjson--zenfigrcjson5)
      - [Provider Guards](#provider-guards)
    - [Validation Details](#validation-details)
      - [Partial Path Resolution](#partial-path-resolution)
      - [Schema-Directed Value Parsing](#schema-directed-value-parsing)
      - [Strict Mode (`--strict`)](#strict-mode---strict)
      - [Error Messages](#error-messages)
    - [Output Formatting](#output-formatting)
      - [.env Format Rules](#env-format-rules)
      - [Null and Undefined Handling](#null-and-undefined-handling)
    - [Environment Support](#environment-support)
    - [Security Requirements](#security-requirements)
    - [Style Guidelines](#style-guidelines)
    - [Testing Strategy](#testing-strategy)
      - [Unit Tests (Vitest)](#unit-tests-vitest)
      - [Integration Tests](#integration-tests)
      - [Edge Case Tests](#edge-case-tests)
      - [Contract Tests](#contract-tests)
      - [Test Coverage Requirements](#test-coverage-requirements)
    - [Documentation](#documentation)
    - [Exit Codes](#exit-codes)
  - [10. Error Catalog](#10-error-catalog)
    - [Error Code Structure](#error-code-structure)
    - [Validation Errors (VAL)](#validation-errors-val)
      - [VAL001: Invalid Type](#val001-invalid-type)
      - [VAL002: Format Violation](#val002-format-violation)
      - [VAL003: Constraint Violation](#val003-constraint-violation)
      - [VAL004: Key Not Found](#val004-key-not-found)
      - [VAL005: Null Not Allowed](#val005-null-not-allowed)
    - [Provider Errors (PROV)](#provider-errors-prov)
      - [PROV001: Connection Failed](#prov001-connection-failed)
      - [PROV002: Authentication Failed](#prov002-authentication-failed)
      - [PROV003: Parameter Not Found](#prov003-parameter-not-found)
      - [PROV004: Encryption Verification Failed](#prov004-encryption-verification-failed)
      - [PROV005: Write Permission Denied](#prov005-write-permission-denied)
    - [CLI Errors (CLI)](#cli-errors-cli)
      - [CLI001: Invalid Flag](#cli001-invalid-flag)
      - [CLI002: Missing Required Argument](#cli002-missing-required-argument)
      - [CLI003: Conflicting Flags](#cli003-conflicting-flags)
    - [System Errors (SYS)](#system-errors-sys)
      - [SYS001: File Not Found](#sys001-file-not-found)
      - [SYS002: Permission Denied](#sys002-permission-denied)
      - [SYS003: Snapshot Schema Mismatch](#sys003-snapshot-schema-mismatch)
  - [11. Performance Characteristics](#11-performance-characteristics)
    - [Operational Limits](#operational-limits)
    - [Expected Latency](#expected-latency)
    - [Rate Limiting](#rate-limiting)
    - [Caching Strategy](#caching-strategy)
    - [Optimization Recommendations](#optimization-recommendations)
    - [Memory Usage](#memory-usage)
    - [Disk Usage](#disk-usage)
  - [12. Concrete Usage Example](#12-concrete-usage-example)
    - [Example Files](#example-files)
    - [SSM State (Initial)](#ssm-state-initial)
    - [Steps](#steps)
    - [Parsed Secrets (per source)](#parsed-secrets-per-source)
    - [Merged Config (Merge Order: api + shared + overrides)](#merged-config-merge-order-api--shared--overrides)
    - [Output (format json)](#output-format-json)
    - [Output (format env)](#output-format-env)
  - [13. Implementation Prompt for LLM](#13-implementation-prompt-for-llm)
  <!-- TOC -->

## 1. Goal

Design and implement a CLI tool called **Zenfig** that orchestrates config providers and a pluggable validation layer (Effect Schema by default, Zod optional). It ensures that application configurations are securely retrieved, strictly validated, and safely exported for runtime use.

## 2. Technical Stack

- **Runtime:** Node.js or Bun (TypeScript).
- **Provider (default):** AWS SSM via the AWS SDK (`aws-ssm` provider).
- **Validation:** Pluggable schema validation: [Effect Schema](https://github.com/Effect-TS/effect) (`effect/Schema`, default) or [Zod](https://github.com/colinhacks/zod).

---

## 3. Core Workflow

### Core Concepts (Layers, Paths, and Values)

Zenfig operates on two related but distinct layers of configuration data:

1. **Stored values (provider layer):** Key/value strings persisted in the backing store (default: AWS SSM) under a `<prefix>/<env>/<service>/...` hierarchy.
2. **Resolved config (runtime layer):** The final, schema-valid configuration object produced by parsing and merging stored values.

Zenfig uses a **canonical key path** for CLI and internal operations:

- Canonical form: dot notation using schema property names, e.g. `api.timeoutMs`.
- Input is case-sensitive; key segments must match the schema-defined property casing exactly.
- Dots are path separators; schema keys that literally contain `.` or `/` are not supported (must be modeled differently).
- Each key segment must match `^[A-Za-z0-9_-]+$` (no whitespace or other punctuation).

Key path representations:

- **Canonical (dot):** `api.timeoutMs`
- **SSM key-path (slash):** `api/timeoutMs` (used in `<prefix>/<env>/<service>/<key-path>`)
- **`.env` key:** `API_TIMEOUT_MS` by default (uppercase + snake_case; separator configurable)

Stored value encoding (provider strings) is schema-directed:

- `string` schema (`Schema.String` / `z.string()`): stored as-is (no JSON quoting)
- `boolean` schema (`Schema.Boolean` / `z.boolean()`): `true` / `false`
- `number` schema (`Schema.Number` / `z.number()`, including integer refinements): base-10 numeric string (e.g. `6500`, `0.25`)
- `array` / `object` schema (`Schema.Array`/`Schema.Struct`/`Schema.Record` or `z.array()`/`z.object()`/`z.record()`): minified JSON (e.g. `["a","b"]`, `{"k":"v"}`)

By default, Zenfig does not print secret values in logs unless explicitly requested via an opt-in flag.

### A. Export Workflow (Fetch -> Parse + Merge -> Validate -> Output)

1. **Fetch:** Retrieve stored values from the provider for the primary service and any `--source` services.
   - Default (AWS SSM): `GetParametersByPath` under `<prefix>/<env>/<service>` (via AWS SDK).
   - Provider returns a flat map of canonical key paths to **string** values.
2. **Parse + Merge:** Convert provider strings into typed values using the schema (schema-directed parsing) and deep-merge all sources.
3. **Validate:** Validate the merged config against the selected validation layer (Effect Schema or Zod).
4. **Format:** Convert the validated object into `.env` (flat) or `.json` (nested).

### B. Upsert Workflow (Input -> Validate -> Push)

1. **Input:** Accept a service name, key, and value (via CLI args or stdin for sensitive values).
2. **Resolve:** Locate the target schema node using partial path resolution (dot notation; case-sensitive input).
3. **Parse + Validate:** Parse the input string into a typed value based on the resolved schema node, then validate with the selected validation layer.
   - Strings are not auto-coerced to numbers/booleans; parsing is schema-directed.
   - Arrays/objects require JSON input (validated and then stored as minified JSON).
4. **Serialize:** Convert the typed value back into the provider string encoding (see Stored value encoding).
5. **Push:** If valid, execute provider `upsert` (default AWS SSM: `PutParameter` to `<prefix>/<env>/<service>/<key-path>` with `SecureString`).
   - _Constraint:_ Use AWS SSM `SecureString` for all writes when supported by provider.
   - Verify encryption type post-write and warn if not SecureString.

### C. Validate Workflow (Input -> Parse -> Validate)

1. **Input:** Accept file path to JSON or `.env` file via `--file`.
2. **Parse:** Load and parse the file contents (JSON or env format auto-detected).
3. **Validate:** Apply full schema validation using the selected validation layer.
4. **Report:** Output validation errors with full paths, expected types, constraints, and suggestions.
   - Exit code 0 if valid, 1 if invalid.

### D. Delete Workflow (Input -> Validate -> Confirm -> Remove)

1. **Input:** Accept service name and key path via CLI.
2. **Validate:** Check key exists in schema (warn if not, but allow deletion).
3. **Confirm:** Require `--confirm` flag or interactive `y/N` prompt for safety (no prompts in `--ci` / non-TTY mode).
4. **Remove:** Execute provider `delete` (default AWS SSM: `DeleteParameter` on `<prefix>/<env>/<service>/<key-path>`).
5. **Audit:** Log deletion with timestamp, user, and key to stderr (values are redacted by default).

### E. Snapshot Workflow

#### Save (Fetch Stored -> Validate -> Store)

1. **Fetch:** Retrieve stored values for the primary service and any `--source` services (per-service, not merged).
2. **Validate (recommended):** Parse + validate fetched values against the schema (warn on unknown keys; error in `--strict` mode).
3. **Metadata:** Add timestamp, services list, environment, provider name, `ssmPrefix`, snapshot `layer: "stored"`, and schema hash (SHA-256).
4. **Store:** Write to `.zenfig/snapshots/<service>-<env>-<timestamp>.json` with filesystem mode `0600`.
5. **Safety:** Warn if snapshots directory is under a git repo and not covered by `.gitignore`.
6. **Optional encryption:** If `--encrypt` is set, encrypt snapshot contents at rest using a key from `ZENFIG_SNAPSHOT_KEY` or `--snapshot-key-file`.

#### Restore (Load -> Validate -> Diff -> Confirm -> Push)

1. **Load:** Read snapshot file (decrypt if encrypted) and validate metadata structure.
2. **Validate:** Check schema compatibility via hash comparison (error by default; allow `--force-schema-mismatch`).
3. **Diff:** Show what would change between current stored state and the snapshot (added/removed/modified keys; redacted by default).
4. **Confirm:** Require explicit `--confirm` unless `--dry-run` (no prompts in `--ci` / non-TTY mode).
5. **Push:** Upsert each key-value pair back into the provider, preserving per-service boundaries; rollback on first failure if provider supports transactions.

#### Snapshot File Format (v1)

Snapshots store **provider-layer** values (strings) keyed by canonical dot paths, grouped by service:

```json
{
  "version": 1,
  "layer": "stored",
  "meta": {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "env": "prod",
    "provider": "aws-ssm",
    "ssmPrefix": "/zenfig",
    "schemaHash": "sha256:<hex>",
    "services": ["api", "shared", "overrides"]
  },
  "data": {
    "api": { "database.url": "postgres://api-main", "api.timeoutMs": "6500" },
    "shared": { "redis.url": "redis://shared" },
    "overrides": { "feature.enableBeta": "true" }
  }
}
```

If `--encrypt` is used, the on-disk snapshot must be encrypted at rest; the spec permits either (a) encrypting the entire file or (b) storing `meta` in plaintext while encrypting `data` as an authenticated ciphertext.

## 4. Provider Model (Pluggable)

### Provider Interface

```ts
type ProviderContext = {
  prefix: string; // e.g. "/zenfig"
  service: string; // e.g. "api"
  env: string; // e.g. "prod"
};

// Canonical key paths (dot notation) -> raw provider strings.
// Example: { "database.url": "postgres://...", "api.timeoutMs": "6500" }
type ProviderKV = Record<string, string>;

interface Provider {
  name: string;
  // Optional provider-specific guard check; should run before any provider operation.
  checkGuards?(ctx: ProviderContext, guards?: unknown): Promise<void>;
  fetch(ctx: ProviderContext): Promise<ProviderKV>;
  upsert(ctx: ProviderContext, keyPath: string, value: string): Promise<void>;
  delete(ctx: ProviderContext, keyPath: string): Promise<void>;
  verifyEncryption?(ctx: ProviderContext, keyPath: string): Promise<EncryptionType>;
  capabilities?: {
    secureWrite?: boolean;
    encryptionVerification?: boolean;
    transactions?: boolean;
  };
}

enum EncryptionType {
  SECURE_STRING = 'SecureString',
  STRING = 'String',
  UNKNOWN = 'Unknown',
}
```

### Default Provider: AWS SSM (`aws-ssm`)

- Implementation uses AWS SDK SSM calls (`GetParametersByPath`, `PutParameter`, `DeleteParameter`).
- Provider maps `ProviderContext` to an SSM path root of `<prefix>/<env>/<service>` and maps `keyPath` (`a.b.c`) to a parameter key path (`a/b/c`).
- Provider must never log secret values; only log key paths and high-level operation details.
- `secureWrite` is true (writes are `SecureString` by default).
- `encryptionVerification` is true (can verify via AWS SSM API).
- `transactions` is false (no atomic multi-key operations).

### Provider Registry

- CLI accepts `--provider <name>` (default: `aws-ssm`).
- Registry returns provider instance by name.
- Additional provider examples (future): `aws-secretsmanager`, `vault`, `env`, `file`.

### Encryption Verification

- After upsert, if `capabilities.encryptionVerification` is true, call `verifyEncryption`.
- Log warning to stderr if encryption type is not `SECURE_STRING`.
- Use `--skip-encryption-check` flag to bypass verification (not recommended for production).

---

## 5. Validator Model (Pluggable)

Zenfig supports multiple schema validators behind a shared adapter interface. Effect Schema is the default; Zod is optional.

### Validator Selection

- Select via CLI `--validation <effect|zod>`, config `validation`, or env `ZENFIG_VALIDATION`.
- Default is `effect` when unspecified.
- `schema` must export `ConfigSchema` for the selected validator.

### Validator Interface

Each adapter must provide a consistent surface:

- **Load schema export:** Load `ConfigSchema` from the `schema` file.
- **Resolve path:** Resolve dot-notation paths to a schema node with canonical casing.
- **Enumerate leaf paths:** Return all leaf schema paths with optional/default metadata.
- **Validate values:** Validate a value against a schema node and return normalized errors.
- **Describe types:** Provide human-readable type/constraint descriptions for error messages.

Reference interface (shape only, not exact types):

```ts
type ValidationIssue = {
  path: string;
  expected: string;
  received: unknown;
  message: string;
};

type ValidationResult = { readonly ok: true } | { readonly ok: false; readonly issues: ReadonlyArray<ValidationIssue> };

type ValidatorAdapter = {
  readonly name: 'effect' | 'zod';
  readonly loadSchema: (filePath: string, exportName: string) => Promise<unknown>;
  readonly resolvePath: (schema: unknown, keyPath: string) => ResolvedPath;
  readonly getLeafPaths: (schema: unknown) => ReadonlyArray<SchemaKeyInfo>;
  readonly validateNode: (schemaNode: unknown, value: unknown) => ValidationResult;
  readonly validateRoot: (schema: unknown, value: unknown) => ValidationResult;
  readonly describeNode: (schemaNode: unknown) => string;
};
```

Adapter requirements:

- Do not enable implicit coercion or type conversions in the underlying validator.
- Detect `optional`, `nullable`, and `default` semantics for leaf metadata and error reporting.
- Keep schema node introspection inside the adapter (core logic treats nodes as opaque).

### Schema Export Conventions

- When `validation=effect`, `ConfigSchema` must be an Effect Schema value.
- When `validation=zod`, `ConfigSchema` must be a Zod schema value.
- The schema file must export exactly one schema value named `ConfigSchema` (no dual exports for multiple validators).
- Schema type mismatches (e.g., Zod schema when `validation=effect`) must fail fast with a clear error.

### Error Normalization

Adapters must normalize validator-specific errors into Zenfig's error catalog, including:

- Full path (canonical dot path)
- Expected type/constraints
- Actual value (truncated if needed)
- Specific failure reason
- Suggested remediation

---

## 6. Configuration Contract

### Merged Config Input

- The merged, typed object constructed from provider `fetch` results after schema-directed parsing and multi-source merge.

### Output

- The merged config must validate against the selected schema validator.
- Invalid or non-object results should produce a validation error with exit code 1.

---

## 7. SSM Naming Convention

- Parameter name format: `<prefix>/<env>/<service>/<key-path>`.
- Default `prefix` is `/zenfig`, configurable via `--ssm-prefix` or `ZENFIG_SSM_PREFIX`.
- `<env>` should be sourced from `--env`, `ZENFIG_ENV`, or `NODE_ENV`, with `dev` as a fallback.
- `<key-path>` mirrors the schema path using `/` as a separator (e.g., `database/url`, `jwt/secret`).
- Each key segment must match `^[A-Za-z0-9_-]+$`; no encoding is applied.
- Service, env, and key segments are case-sensitive and must be used consistently.
- Zenfig uses canonical dot paths in the CLI (`database.url`) and providers translate dot paths to backend naming (`database/url` for SSM).

---

## 8. Multi-Source Composition

Zenfig may compose multiple SSM roots into a single config output.

### CLI Input

- `zenfig export <service> [--source <service>]...` to include additional services.
- Each source resolves to `<prefix>/<env>/<service>/...` and is fetched independently.

### Merge Semantics

- All sources are merged into a single config object.
- Merge order is last-wins (later sources override earlier keys).
- Precedence order is: primary `<service>` first, then each `--source` in the order provided.
  - Example: `zenfig export api --source shared --source overrides`
    - SSM paths fetched (with `--env prod` and default prefix `/zenfig`):
      - `/zenfig/prod/api/database/url = postgres://api-main`
      - `/zenfig/prod/api/feature/enableBeta = false`
      - `/zenfig/prod/shared/database/url = postgres://shared`
      - `/zenfig/prod/shared/redis/url = redis://shared`
      - `/zenfig/prod/overrides/feature/enableBeta = true`
    - Parsed secrets objects (per source, after schema-directed parsing + unflattening):
      - `api`: `{"database":{"url":"postgres://api-main"},"feature":{"enableBeta":false}}`
      - `shared`: `{"database":{"url":"postgres://shared"},"redis":{"url":"redis://shared"}}`
      - `overrides`: `{"feature":{"enableBeta":true}}`
    - Merged config (order: `api` + `shared` + `overrides`, last wins):
      - `{"database":{"url":"postgres://shared"},"feature":{"enableBeta":true},"redis":{"url":"redis://shared"}}`

### Merge Conflict Behavior

- **Same-type overrides:** When multiple sources provide the same key with compatible types (e.g., both strings), the last source wins silently.
- **Type mismatches:** When sources provide the same key with incompatible types (e.g., string vs object):
  - Default: Last source wins (complete replacement), log warning to stderr with source details.
  - Strict mode (`--strict-merge`): Treat as error, exit code 1, list all conflicts.
- **Partial object merges:** Objects are deep-merged (nested keys combine), primitives are replaced.
  - Example: `{a: {b: 1}}` + `{a: {c: 2}}` = `{a: {b: 1, c: 2}}`
  - Example: `{a: {b: 1}}` + `{a: "string"}` = `{a: "string"}` (primitive replaces object)
- **Arrays:** Arrays are replaced in full (no element-wise merge).
- **Unknown keys:** Keys not present in the schema are allowed by default (treated as strings) but should emit a warning; `--strict` turns this into an error.
- **Conflict reporting:** Use `--warn-on-override` to log all overrides (useful for debugging inheritance issues).

---

## 9. Implementation Requirements

### Implementation Conventions

- Follow the conventions used by other packages and apps in the monorepo (e.g., TypeScript config, Vitest config, linting, and project layout).
- Use Effect.ts in line with other packages in the monorepo, and implement logic using pipe-based Effect composition only (no generator-based `Effect.gen`).

### Project Structure

- `src/cli.ts`: CLI entry point using `commander`.
- `src/index.ts`: Package entry point for programmatic usage.
- `src/api.ts`: Programmatic export API wrapper (export-only).
- `src/config.ts`: Config resolution and merging (CLI flags, env vars, rc file, defaults).
- `src/commands/*`: Command implementations (export, upsert, validate, list, delete, snapshot).
- `src/lib/*`: Formatting, merge, flatten, and redaction utilities.
- `src/schema/*`: Schema loader, resolver, parser, and validator glue.
- `src/validation/*`: Validator interface plus Effect Schema and Zod adapters.
- `src/providers/*`: Provider interface, registry, and implementations (e.g., AWS SSM).
- `src/errors.ts`: Error types, formatting, and exit codes.

### CLI Interface

#### Core Commands

```bash
# Global options (available on all commands)
  --ci                        # Disable prompts; require explicit flags like --confirm
  --strict                    # Treat warnings as errors (e.g., unknown keys)
  --validation <effect|zod>   # Validation layer (default: effect)

# Export configuration
zenfig export <service> [options]
  --source <service>          # Additional sources (repeatable)
  --format <env|json>         # Output format (default: env)
  --provider <name>           # Provider name (default: aws-ssm)
  --env <environment>         # Environment name (overrides NODE_ENV)
  --separator <char>          # Env key separator (default: _)
  --strict-merge              # Fail on type conflicts during merge
  --warn-on-override          # Log all key overrides
  --cache <duration>          # Cache provider fetches (e.g., 30s, 5m; dev-only)
  --no-cache                  # Disable cache even if configured
  --ssm-prefix <prefix>       # SSM path prefix (default: /zenfig)
  --schema <path>             # Schema path (default: src/schema.ts)
  --validation <effect|zod>   # Validation layer (default: effect)

# Upsert configuration value
zenfig upsert <service> <key> [value] [options]
  --provider <name>           # Provider name (default: aws-ssm)
  --env <environment>         # Environment name (overrides NODE_ENV)
  --stdin                     # Read value from stdin (for sensitive data)
  --type <auto|string|int|float|bool|json>  # How to parse input before validation (default: auto)
  --skip-encryption-check     # Skip encryption verification (not recommended)
  --ssm-prefix <prefix>       # SSM path prefix (default: /zenfig)
  --schema <path>             # Schema path (default: src/schema.ts)
  --validation <effect|zod>   # Validation layer (default: effect)

# Validate configuration file
zenfig validate [options]
  --file <path>               # Path to JSON or .env file
  --schema <path>             # Schema path (default: src/schema.ts)
  --format <env|json>         # File format (auto-detected if not specified)
  --validation <effect|zod>   # Validation layer (default: effect)

# List configuration keys
zenfig list <service> [options]
  --provider <name>           # Provider name (default: aws-ssm)
  --env <environment>         # Environment name (overrides NODE_ENV)
  --format <keys|table|json>  # Output format (default: keys)
  --show-values               # Print secret values (TTY only; use --unsafe-show-values for CI)
  --unsafe-show-values        # Allow printing secrets even when stdout is not a TTY (dangerous)
  --ssm-prefix <prefix>       # SSM path prefix (default: /zenfig)
```

#### Examples

```bash
# List all keys (redacted values)
zenfig list api --env prod

# List keys with values in JSON format (local dev only)
zenfig list api --env prod --format json --show-values

# Delete configuration value
zenfig delete <service> <key> [options]
  --provider <name>           # Provider name (default: aws-ssm)
  --env <environment>         # Environment name (overrides NODE_ENV)
  --confirm                   # Skip interactive confirmation
  --ssm-prefix <prefix>       # SSM path prefix (default: /zenfig)
  --schema <path>             # Schema path (default: src/schema.ts)
  --validation <effect|zod>   # Validation layer (default: effect)

# Save configuration snapshot
zenfig snapshot save <service> [options]
  --source <service>          # Additional sources (repeatable)
  --provider <name>           # Provider name (default: aws-ssm)
  --env <environment>         # Environment name (overrides NODE_ENV)
  --output <path>             # Output path (default: .zenfig/snapshots/)
  --encrypt                   # Encrypt snapshot at rest (recommended)
  --snapshot-key-file <path>  # Read encryption key from file (preferred over CLI args)
  --ssm-prefix <prefix>       # SSM path prefix (default: /zenfig)
  --schema <path>             # Schema path (default: src/schema.ts)
  --validation <effect|zod>   # Validation layer (default: effect)

# Restore configuration from snapshot
zenfig snapshot restore <snapshot-file> [options]
  --provider <name>           # Provider name (default: aws-ssm)
  --dry-run                   # Show diff without applying changes
  --force-schema-mismatch     # Allow restore despite schema hash mismatch
  --confirm                   # Skip interactive confirmation
  --show-values               # Print secret values in diff output (TTY only)
  --unsafe-show-values        # Allow printing secrets even when stdout is not a TTY (dangerous)
  --ssm-prefix <prefix>       # SSM path prefix (default: /zenfig)
  --schema <path>             # Schema path (default: src/schema.ts)
  --validation <effect|zod>   # Validation layer (default: effect)
```

### Programmatic API (TypeScript)

Zenfig must expose a TypeScript API for **export-only** usage. This API is intended for programmatic use (e.g., SST
deployments) and **must not** expose any write actions (no upsert, delete, snapshot, or list).

The API should:

- Run the same export workflow as the CLI (fetch -> parse + merge -> validate -> format).
- Accept explicit config overrides, but default to the same config resolution rules as the CLI.
- Return both structured data and the formatted output string.

Proposed surface (exported from the package root):

```ts
type ExportApiOptions = {
  service: string;
  sources?: ReadonlyArray<string>;
  format?: 'env' | 'json';
  separator?: string;
  strict?: boolean;
  strictMerge?: boolean;
  warnOnOverride?: boolean;
  config?: Partial<ResolvedConfig>; // provider, env, validation, schema path, prefix, etc.
};

type ExportApiResult = {
  config: Record<string, unknown>;
  formatted: string;
  conflicts: ReadonlyArray<MergeConflict>;
  warnings: ReadonlyArray<string>;
};

export function exportConfig(options: ExportApiOptions): Promise<ExportApiResult>;
```

Example usage:

```ts
import { exportConfig } from 'zenfig';

const result = await exportConfig({
  service: 'api',
  sources: ['shared'],
  format: 'json',
  config: {
    env: 'prod',
    provider: 'aws-ssm',
    ssmPrefix: '/zenfig',
    schema: 'src/schema.ts',
    validation: 'effect',
  },
});

// Structured config for use in deployments
const configObject = result.config;
```

### Environment Variable Precedence

Configuration values are resolved in the following order (highest to lowest priority):

1. CLI flags (e.g., `--env prod`)
2. Environment variables (e.g., `ZENFIG_ENV`, `ZENFIG_SSM_PREFIX`)
3. Config file (`zenfigrc.json` or `zenfigrc.json5` in project root, if present)
4. Defaults (`NODE_ENV` for env, `/zenfig` for prefix, `dev` as fallback)

Supported environment variables:

- `ZENFIG_ENV`: Default environment name
- `ZENFIG_SSM_PREFIX`: Default SSM path prefix
- `ZENFIG_PROVIDER`: Default provider name
- `ZENFIG_SCHEMA`: Default schema path
- `ZENFIG_VALIDATION`: Validation layer (`effect` or `zod`, default: `effect`)
- `ZENFIG_CACHE`: Default provider fetch cache duration (e.g., `5m`, `0` to disable)
- `ZENFIG_CI`: If set (`1`/`true`), disable prompts and require explicit confirmation flags
- `ZENFIG_IGNORE_PROVIDER_GUARDS`: If set (`1`/`true`), skip provider guard checks (emergency use)
- `ZENFIG_SNAPSHOT_KEY`: Snapshot encryption key (avoid setting in shared shells/CI logs)
- `NODE_ENV`: Fallback for environment name if `ZENFIG_ENV` not set

### Config File (`zenfigrc.json` / `zenfigrc.json5`)

If present in the project root, `zenfigrc.json` or `zenfigrc.json5` provides non-secret defaults for Zenfig.
Both are parsed with JSON5, so comments and trailing commas are allowed.

Example:

```json
{
  "env": "prod",
  "provider": "aws-ssm",
  "ssmPrefix": "/zenfig",
  "schema": "src/schema.ts",
  "validation": "effect",
  "sources": ["shared", "overrides"],
  "format": "env",
  "separator": "_",
  "cache": "5m",
  "providerGuards": {
    "aws-ssm": {
      "accountId": "123456789012",
      "region": "us-east-1"
    }
  }
}
```

Rules:

- `zenfigrc.json`/`zenfigrc.json5` must not contain secrets.
- CLI flags override environment variables, which override `zenfigrc.json`/`zenfigrc.json5`, which override defaults.
- Unknown keys should be ignored with a warning (or error in `--strict` mode).
- The schema file referenced by `schema` must export `ConfigSchema` for the selected validation layer.

#### Provider Guards

`providerGuards` is an optional, provider-extensible mechanism to prevent accidental reads/writes against the wrong
account, region, or environment. Provider implementations own both the config shape for their guard entries and the
logic for evaluating them. Zenfig passes the provider-scoped guard config through as-is and does not interpret or
validate guard contents at the core level.

Recommended shape:

```json
{
  "providerGuards": {
    "<provider>": {
      "...": "provider-specific guard values"
    }
  }
}
```

AWS example (for `aws-ssm` provider):

```json
{
  "providerGuards": {
    "aws-ssm": {
      "accountId": "123456789012",
      "region": "us-east-1"
    }
  }
}
```

Guidelines:

- Guards are optional and ignored by providers that do not implement them.
- Providers should error with a clear message when a guard mismatch is detected (e.g., account or region mismatch).
- Providers are responsible for defining guard config types and for performing the guard checks before any provider
  operation.
- Implementations should allow an explicit override for emergency use (e.g., a CLI flag or env var such as
  `ZENFIG_IGNORE_PROVIDER_GUARDS=1`), but the default behavior should be to fail fast.

### Validation Details

#### Pluggable Validation Layer

Validation is selected via config/CLI (`validation: effect|zod`) and must be wired through a small adapter interface.

Required adapter capabilities:

- Load the schema export for the selected validator (Effect Schema or Zod).
- Resolve dot-paths to schema nodes (for upsert validation and error reporting).
- Enumerate leaf paths (for `.env` validation and formatting).
- Validate a value against a schema node and return structured errors.
- Provide human-readable type/constraint descriptions for error messages.

#### Partial Path Resolution

- Keys use dot notation (e.g., `database.url`, `api.timeoutMs`).
- Path resolution is case-sensitive; input must match schema-defined property casing.
- Schema paths are traversed recursively to find the target node and compute the canonical key path.
- Algorithm:
  1. Split key by `.` into segments (e.g., `database.url` → `["database", "url"]`)
  2. Reject any segment that does not match `^[A-Za-z0-9_-]+$`
  3. Starting from schema root, traverse each segment:
     - If current node is an object schema (e.g., `Schema.Struct` or `z.object()`), look for a property whose name matches the segment exactly
     - If segment not found, error: `Key 'database.url' not found in schema`
  4. At final segment, extract the schema node (e.g., `Schema.String` or `z.string()` with a URI refinement)
  5. Validate value against the extracted schema node using the selected validation layer
- Example validation for `database.url`:
  ```ts
  // Schema (Effect): Schema.Struct({ database: Schema.Struct({ url: Schema.String.pipe(Schema.pattern(URI_REGEX)) }) })
  // Key: "database.url"
  // Segments: ["database", "url"]
  // Resolved type: Schema.String (URI refinement)
  // Value: "postgres://localhost:5432/mydb"
  // Result: Valid ✓
  ```

#### Schema-Directed Value Parsing

Zenfig parses provider strings and CLI/file inputs into typed values **before** validation. Parsing is explicit and schema-driven; no implicit type coercion.

Parsing rules (by resolved schema node):

- `Schema.String` / `z.string()`: keep as string (no implicit JSON parsing)
- `Schema.Boolean` / `z.boolean()`: accept `true`/`false` (case-insensitive), parse to boolean
- `Schema.Number` / `z.number()` (integer refinement when required): parse base-10 number; reject decimals for integer schemas and reject NaN/Infinity
- `Schema.Array` / `Schema.Struct` / `Schema.Record` or `z.array()` / `z.object()` / `z.record()`: require JSON input; parse with `JSON.parse`
- `Schema.Union` / `z.union()`: attempt each branch’s parsing strategy in schema order and validate; choose the first branch that validates

For `upsert`, `--type` can override parsing:

- `--type string`: treat input as raw string even if the schema is not `Schema.String` / `z.string()` (validation will likely fail unless schema accepts string)
- `--type json`: force `JSON.parse` first (useful for arrays/objects)
- `--type int|float|bool`: force the corresponding parser first

Unknown keys (not present in schema) are treated as strings, included in `secrets`, and should emit a warning (or error in `--strict` mode).

When parsing `.env` files (for `validate`), Zenfig must map `.env` keys back to schema paths by generating the expected `.env` key for each schema leaf path (using the same output formatting rules) and matching case-sensitively. This avoids ambiguous “reverse snake_case” heuristics.

#### Strict Mode (`--strict`)

Strict mode promotes selected warnings to errors:

- Unknown keys from providers, `.env` files, or JSON inputs
- Merge type conflicts (equivalent to `--strict-merge`)

#### Error Messages

All validation errors must include:

1. **Full path:** The complete key path (e.g., `database.url`)
2. **Expected type:** Human-readable type (e.g., `string (URI format)`)
3. **Actual value:** The value that failed validation (truncated if > 100 chars)
4. **Constraint details:** Specific reason for failure (e.g., `must be a valid URI`, `minimum value is 1`)
5. **Suggestion:** Actionable fix (e.g., `Example: postgres://host:port/db`)

Example error output:

```
Validation Error: database.url

  Expected: string (URI format)
  Received: "not-a-url"
  Problem:  Value must be a valid URI

  Suggestion: Provide a valid URI format
  Example:    postgres://localhost:5432/mydb

  Schema path: database.url
  Exit code:   1
```

### Output Formatting

#### .env Format Rules

- **Key sorting:** Alphabetical (case-insensitive) for determinism
- **Key casing:** UPPERCASE for all keys
- **Nested keys:** Flattened with `_` separator (configurable via `--separator`)
  - Convert each path segment from camelCase/PascalCase to `SNAKE_CASE`
  - Join segments with the separator and uppercase the result
  - Example: `database.url` → `DATABASE_URL`
  - Example: `api.timeoutMs` → `API_TIMEOUT_MS`
  - Example with `--separator .`: `database.url` → `DATABASE.URL`
- **Quoting rules:**
  - No quotes: Values that contain no spaces, `#`, `=`, `\n`, or `$`, and do not start/end with whitespace
  - Double quotes: Values containing spaces, `#`, `=`, `\n`, `$`, or starting/ending with whitespace
  - Escape sequences: `\n` for newlines, `\\` for backslash, `\"` for quotes
  - Never use single quotes
- **Type serialization:**
  - **Strings:** Direct value, quoted if needed
  - **Numbers:** Direct value (e.g., `PORT=3000`)
  - **Booleans:** Lowercase `true` or `false` (not quoted)
  - **Arrays:** JSON.stringify with no spacing (e.g., `TAGS=["a","b","c"]`)
  - **Objects:** JSON.stringify with no spacing (e.g., `OPTS={"key":"value"}`)
  - **null:** Error (not allowed unless schema explicitly permits via a union with null, e.g., `Schema.Null` / `z.null()`)
  - **undefined:** Omit key entirely (never serialize)
- **Array serialization:** Use `JSON.stringify(value)` with no spacing, no pretty-printing
  - Example: `["a", "b"]` → `ITEMS=["a","b"]`
  - Empty arrays: `ITEMS=[]`
- **Special characters:** Properly escape in double quotes
  - Newlines: `"line1\nline2"`
  - Quotes: `"He said \"hello\""`
  - Dollar signs: `"${NOT_A_VAR}"` (literal, not expanded)

Example .env output:

```bash
API_TIMEOUT_MS=30000
DATABASE_POOL_MAX=10
DATABASE_URL="postgres://localhost:5432/mydb?sslmode=require"
FEATURE_ENABLE_BETA=true
REDIS_URL=redis://localhost:6379
TAGS=["prod","api","v2"]
```

#### Null and Undefined Handling

- **null:**
  - By default, `null` values cause validation error: `Value cannot be null`
  - Allow `null` explicitly via a union with null (optional fields only affect `undefined`, not `null`)
  - If allowed and encountered:
    - `.env` format: Omit the key (env vars cannot represent null)
    - `.json` format: Include as `"key": null`
- **undefined:**
  - Always omit the key from output (both `.env` and `.json`)
  - Occurs when optional schema fields have no value
  - Never serialize as string `"undefined"`
- **Empty strings:**
  - Treated as valid string value (not null/undefined)
  - `.env` format: `KEY=""` or `KEY=` (no value after `=`)
  - `.json` format: `"key": ""`

### Environment Support

- **Local:** No external binaries required; `aws-ssm` uses the AWS SDK.
- **CI/CD:** Ensure the tool exits with `code 1` on any validation error to break the build.
- **Non-interactive:** In `--ci` / `ZENFIG_CI=1` mode (or when stdin is not a TTY), never prompt; require explicit flags like `--confirm`.
- **Logging:** Write logs to `stderr` so `stdout` can be redirected to files; never print secret values by default.

### Security Requirements

- **Redaction by default:** Commands must not print secret values unless explicitly requested via `--show-values` (and must support redaction even in structured outputs like JSON).
- **No secrets in process args:** Avoid passing secret values via command-line arguments to any external processes.
- **Showing values is gated:** `--show-values` may only print values when stdout is a TTY; otherwise require `--unsafe-show-values` (dangerous, intended for local debugging only).
- **Snapshots:** Write snapshot files with mode `0600` and support optional encryption at rest (`--encrypt` using `ZENFIG_SNAPSHOT_KEY` or `--snapshot-key-file`).

### Style Guidelines

- Favor functional composition and pure functions where possible.
- Avoid OOP patterns such as classes, inheritance, or mutable shared state.

### Testing Strategy

#### Unit Tests (Vitest)

Core logic that must be tested:

1. **Schema path resolution:**
   - Valid nested paths (e.g., `database.url`, `api.timeout.ms`)
   - Invalid paths (non-existent keys)
   - Case normalization
   - Deep nesting (5+ levels)

2. **Merge ordering:**
   - Multiple sources with overlapping keys
   - Type conflicts (string vs object)
   - Deep merge behavior
   - Array handling (replace vs merge)

3. **Env flattening:**
   - Nested object to flat KEY_VALUE format
   - Custom separators
   - Special character escaping
   - Quote handling rules
   - Type serialization (arrays, booleans, numbers)

4. **Validation:**
   - Type validation (string, number, boolean, array, object)
   - Format validation (URI, email, date, etc.)
   - Constraint validation (min, max, regex, enum)
   - Null/undefined handling
   - Error message formatting
   - Adapter coverage for Effect Schema and Zod

#### Integration Tests

Test complete workflows with real dependencies:

1. **Export workflow:**
   - Mock aws-ssm provider
   - Full validation pipeline
   - Multiple output formats

2. **Upsert workflow:**
   - Schema validation before write
   - Provider write operation
   - Encryption verification
   - Error handling

3. **Multi-source composition:**
   - Fetch from multiple sources
   - Correct merge order
   - Conflict detection

4. **List workflow:**
   - Fetch keys per service
   - Redaction behavior

#### Edge Case Tests

Critical edge cases that must be covered:

1. **Empty values:**
   - Empty strings: `""`
   - Empty arrays: `[]`
   - Empty objects: `{}`
   - Missing optional fields

2. **Special characters in values:**
   - Newlines: `"line1\nline2"`
   - Quotes: `"He said \"hello\""`
   - Backslashes: `"C:\\path\\to\\file"`
   - Dollar signs: `"${NOT_VAR}"`
   - Hash symbols: `"# comment"`
   - Equals signs: `"key=value"`
   - Unicode: `"日本語"`

3. **Special characters in keys:**
   - Disallowed characters in key segments (`.` and `/`, whitespace, punctuation)
   - Uppercase vs lowercase normalization
   - Numeric key names: `"0"`, `"123"`

4. **Deep nesting:**
   - 10+ levels deep: `a.b.c.d.e.f.g.h.i.j.k`
   - Mixed nesting (objects and arrays)

5. **Large configurations:**
   - 1000+ keys
   - Very long values (10KB+ strings)
   - Large arrays (100+ items)

6. **Type edge cases:**
   - Very large numbers (beyond Number.MAX_SAFE_INTEGER)
   - Floating point precision
   - Boolean strings: `"true"` vs `true`
   - Null vs undefined vs missing
   - Mixed-type arrays: `[1, "two", true]`

#### Contract Tests

Provider interface compliance:

1. Each provider implementation must pass:
   - Fetch returns expected format
   - Upsert writes correctly
   - Delete removes correctly
   - Error handling (network errors, auth failures)
   - Capabilities reported accurately

2. Mock provider for testing:
   - In-memory provider for CI/CD
   - Predictable behavior
   - Fast execution

#### Test Coverage Requirements

- Minimum 80% code coverage
- 100% coverage for critical paths (validation, merge, flattening)
- All error code paths tested
- All CLI commands have integration tests

### Documentation

- Provide Markdown-based documentation covering setup, CLI usage, provider configuration, and common workflows.

### Exit Codes

- `0`: Success
- `1`: Validation errors or non-auth provider operation failures
- `2`: Configuration errors (invalid flags, missing required args)
- `3`: File not found or permission errors
- `4`: Provider connection, authentication, or authorization errors
- `5`: Schema compatibility errors (snapshot restore with mismatched schema)

Default mapping:

- `CLI*` → exit `2`
- `SYS001`/`SYS002` → exit `3`
- `PROV001`/`PROV002`/`PROV005` → exit `4`
- `SYS003` → exit `5` (unless forced)
- All other errors → exit `1`

---

## 10. Error Catalog

### Error Code Structure

Each error has:

- **Code:** Unique identifier (e.g., `VAL001`, `PROV002`)
- **Category:** Validation, Provider, CLI, System
- **Severity:** Error (command fails) or Warning (continue with caution)
- **Exit code:** Derived from category and error type (see Exit Codes)
- **Message:** Human-readable description
- **Remediation:** Suggested fix with examples

### Validation Errors (VAL)

#### VAL001: Invalid Type

**Message:** `Value does not match expected type`
**Example:**

```
Validation Error [VAL001]: api.timeoutMs

  Expected: integer (minimum: 1)
  Received: "not-a-number"
  Problem:  Value must be an integer

  Remediation: Provide a valid integer value
  Example:     5000
```

#### VAL002: Format Violation

**Message:** `Value does not match required format`
**Example:**

```
Validation Error [VAL002]: database.url

  Expected: string (URI format)
  Received: "not-a-url"
  Problem:  Value must be a valid URI

  Remediation: Provide a valid URI
  Example:     postgres://localhost:5432/mydb
```

#### VAL003: Constraint Violation

**Message:** `Value violates schema constraints`
**Example:**

```
Validation Error [VAL003]: api.port

  Expected: integer (minimum: 1024, maximum: 65535)
  Received: 80
  Problem:  Value is below minimum of 1024

  Remediation: Provide a value >= 1024
```

#### VAL004: Key Not Found

**Message:** `Key path does not exist in schema`
**Example:**

```
Validation Error [VAL004]: database.invalidKey

  Problem:  Key 'database.invalidKey' not found in schema

  Remediation: Check schema for available keys
  Available keys under 'database':
    - database.url
    - database.pool.max
    - database.pool.min
```

#### VAL005: Null Not Allowed

**Message:** `Null value not permitted for this key`
**Example:**

```
Validation Error [VAL005]: api.key

  Expected: string
  Received: null
  Problem:  This field cannot be null

  Remediation: Provide a non-null value or allow null explicitly in the schema (e.g., `Schema.Null` / `z.null()`)
```

### Provider Errors (PROV)

#### PROV001: Connection Failed

**Message:** `Failed to connect to provider`
**Remediation:**

- Check network connectivity
- Verify AWS credentials (for aws-ssm)
- Check AWS region configuration and network access
- Verify service exists

#### PROV002: Authentication Failed

**Message:** `Provider authentication failed`
**Remediation:**

- For AWS: Check `AWS_PROFILE`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Verify IAM permissions (ssm:GetParameters, ssm:PutParameter, ssm:DeleteParameter)
- Check region configuration

#### PROV003: Parameter Not Found

**Message:** `SSM parameter does not exist`
**Remediation:**

- Verify parameter path: `<prefix>/<env>/<service>/<key>`
- Check `--env` flag matches expected environment
- Use `aws ssm get-parameters-by-path` to list available parameters

#### PROV004: Encryption Verification Failed

**Message:** `Parameter is not encrypted as SecureString`
**Severity:** Warning
**Remediation:**

- Manually update parameter type in AWS SSM console
- Or use `--skip-encryption-check` (not recommended for production)

#### PROV005: Write Permission Denied

**Message:** `Insufficient permissions to write parameter`
**Remediation:**

- Check IAM policy includes `ssm:PutParameter` action
- Verify resource ARN matches target parameter path
- Check for service control policies (SCPs) blocking writes

### CLI Errors (CLI)

#### CLI001: Invalid Flag

**Message:** `Unknown or invalid command-line flag`
**Remediation:** Run `zenfig <command> --help` for available flags

#### CLI002: Missing Required Argument

**Message:** `Required argument not provided`
**Remediation:** Check command syntax, e.g., `zenfig export <service>`

#### CLI003: Conflicting Flags

**Message:** `Incompatible flags used together`
**Example:** `--stdin and value argument both provided for upsert`

### System Errors (SYS)

#### SYS001: File Not Found

**Message:** `Required file does not exist`
**Remediation:**

- Check file path is correct
- Verify file permissions (readable)
- For schema: Ensure `src/schema.ts` exports `ConfigSchema` for the selected validation layer

#### SYS002: Permission Denied

**Message:** `Insufficient filesystem permissions`
**Remediation:**

- Check file/directory permissions
- Verify write access for snapshot directory (`.zenfig/snapshots/`)

#### SYS003: Snapshot Schema Mismatch

**Message:** `Snapshot schema hash does not match current schema`
**Severity:** Error by default (warning if forced)
**Remediation:**

- Review schema changes since snapshot was created
- Use `--force-schema-mismatch` to restore anyway (may cause validation errors)
- Regenerate snapshot with current schema

---

## 11. Performance Characteristics

### Operational Limits

- **Maximum config size:** 10,000 keys per service (SSM API limit: 10,000 parameters per path)
- **Maximum value size:** 8 KB per value (SSM SecureString limit)
- **Maximum nesting depth:** 20 levels (practical limit for readability)
- **Maximum sources:** 50 sources per export (to avoid excessive merge complexity)

### Expected Latency

All timings assume AWS us-east-1 region, warm IAM credentials:

| Operation                | Avg Latency | P95 Latency | Notes                                         |
| ------------------------ | ----------- | ----------- | --------------------------------------------- |
| `export` (10 keys)       | 400ms       | 800ms       | Dominated by SSM GetParameters API call       |
| `export` (100 keys)      | 600ms       | 1.2s        | Batch fetching reduces overhead               |
| `export` (1000 keys)     | 2s          | 4s          | Multiple batch API calls required             |
| `upsert`                 | 300ms       | 600ms       | Single PutParameter + encryption verification |
| `validate` (local file)  | 50ms        | 100ms       | Pure compute, no I/O                          |
| `snapshot save`          | 600ms       | 1.2s        | Fetch + validate + local write                |
| `snapshot restore`       | 5s          | 10s         | Per-key upsert (100 keys)                     |
| Multi-source (3 sources) | +200ms      | +400ms      | Linear overhead per source                    |

### Rate Limiting

**AWS SSM API limits:**

- GetParameters: 40 requests/second (per account, per region)
- PutParameter: 40 requests/second
- DeleteParameter: 40 requests/second

**Zenfig behavior:**

- Batch GetParameters requests (max 10 parameters per call)
- For 100 keys: 10 batched requests = ~250ms at 40 req/s
- Implement exponential backoff on `ThrottlingException`
- Log warning if approaching rate limits

### Caching Strategy

**Schema compilation cache:**

- Cache compiled validators/decoders for the selected validation layer in memory for duration of CLI process
- Reuse across multiple validations (e.g., snapshot restore with 100 keys)
- No disk cache (schema changes should be reflected immediately)

**Provider fetch cache:**

- No caching by default (always fetch fresh values)
- Optional `--cache <duration>` flag for development (e.g., `--cache 5m`)
- Cache key: `<provider>:<service>:<env>:<sources-hash>`
- Cache storage: Temp directory (`.zenfig/cache/`)
- Cache invalidation: Age-based (TTL) or manual (`--no-cache` flag)

### Optimization Recommendations

1. **Large configs (1000+ keys):**
   - Use `--format json` for export (faster than env flattening)
   - Consider splitting into multiple services (logical grouping)
   - Use snapshot restore instead of individual upserts for bulk updates

2. **CI/CD pipelines:**
   - Use validation-only steps (no provider calls) for PR checks
   - Parallelize exports for multiple services

3. **Development workflow:**
   - Use `--cache 5m` to avoid repeated SSM calls during iteration
   - Use local file provider for faster testing

4. **Multi-region deployments:**
   - Run Zenfig in same region as SSM parameters to minimize latency
   - Consider regional SSM replication for DR

### Memory Usage

- **Baseline:** ~50 MB (Node.js runtime + dependencies)
- **Per 1000 keys:** +10 MB (in-memory config object)
- **Peak:** ~100 MB for typical workloads (100-500 keys)
- **Large configs (5000+ keys):** ~200 MB

### Disk Usage

- **Snapshots:** ~1 KB per 10 keys (JSON format)
- **Cache (if enabled):** ~500 bytes per key
- **Logs:** Negligible (stderr only, no persistent logs)

---

## 12. Concrete Usage Example

### Example Files

`src/schema.ts` (Effect Schema example):

```ts
import * as Schema from 'effect/Schema';

export const ConfigSchema = Schema.Struct({
  database: Schema.Struct({
    url: Schema.String,
  }),
  redis: Schema.Struct({
    url: Schema.String,
  }),
  feature: Schema.Struct({
    enableBeta: Schema.Boolean,
  }),
  api: Schema.Struct({
    timeoutMs: Schema.Number,
  }),
});
```

Zod equivalent:

```ts
import { z } from 'zod';

export const ConfigSchema = z.object({
  database: z.object({
    url: z.string(),
  }),
  redis: z.object({
    url: z.string(),
  }),
  feature: z.object({
    enableBeta: z.boolean(),
  }),
  api: z.object({
    timeoutMs: z.number(),
  }),
});
```

### SSM State (Initial)

- `/zenfig/prod/api/database/url = postgres://api-main`
- `/zenfig/prod/api/feature/enableBeta = false`
- `/zenfig/prod/shared/redis/url = redis://shared`
- `/zenfig/prod/shared/api/timeoutMs = 60000`
- `/zenfig/prod/overrides/feature/enableBeta = true`

### Steps

1. **Upsert new value**

```
zenfig upsert api api.timeoutMs 6500 --env prod
```

Result: writes `/zenfig/prod/api/api/timeoutMs = 6500` (validated per the selected schema).

2. **Upsert invalid value**

```
zenfig upsert api database.url "not-a-url" --env prod
```

Result: validation error, exit code 1, no write.

3. **Export with multiple sources (merge order)**

```
zenfig export api --source shared --source overrides --env prod --format json
```

4. **Validate configuration file**

```bash
# Validate a local .env file before deployment
zenfig validate --file .env.prod --schema src/schema.ts
```

Result: Validates all keys and values, reports any errors with detailed messages.

5. **List stored keys**

```bash
# List stored keys for a service
zenfig list api --env prod --format table
```

Result: Shows stored keys (and values if `--show-values` is provided), redacted by default.

```
┌─────────────────┬───────────────────────────────┐
│ Key             │ Stored (Provider)             │
├─────────────────┼───────────────────────────────┤
│ api.timeoutMs   │ <redacted>                    │
│ database.url    │ <redacted>                    │
│ feature.enableBeta │ <redacted>                 │
│ redis.url       │ <redacted>                    │
└─────────────────┴───────────────────────────────┘
```

6. **Delete configuration value**

```bash
# Remove deprecated config key
zenfig delete api legacy.setting --env prod --confirm
```

Result: Deletes `/zenfig/prod/api/legacy/setting`, logs deletion with timestamp.

7. **Save configuration snapshot**

```bash
# Backup production config before major change
zenfig snapshot save api --source shared --env prod
```

Result: Saves to `.zenfig/snapshots/api-prod-2024-01-15T10-30-00.json` with metadata.

8. **Restore configuration from snapshot**

```bash
# Rollback to previous snapshot after failed deployment
zenfig snapshot restore .zenfig/snapshots/api-prod-2024-01-15T10-30-00.json --dry-run
```

Result: Shows diff of what would change, requires `--confirm` to apply.

9. **Upsert with stdin (secure)**

```bash
# Set sensitive value without exposing in process list
echo "supersecret" | zenfig upsert api jwt.secret --stdin --env prod
```

Result: Writes `/zenfig/prod/api/jwt/secret` as SecureString, verifies encryption.

### Parsed Secrets (per source)

- `api`:
  `{"database":{"url":"postgres://api-main"},"feature":{"enableBeta":false},"api":{"timeoutMs":6500}}`
- `shared`:
  `{"redis":{"url":"redis://shared"},"api":{"timeoutMs":60000}}`
- `overrides`:
  `{"feature":{"enableBeta":true}}`

### Merged Config (Merge Order: api + shared + overrides)

```json
{
  "database": { "url": "postgres://api-main" },
  "redis": { "url": "redis://shared" },
  "feature": { "enableBeta": true },
  "api": { "timeoutMs": 60000 }
}
```

### Output (format json)

```json
{
  "database": { "url": "postgres://api-main" },
  "redis": { "url": "redis://shared" },
  "feature": { "enableBeta": true },
  "api": { "timeoutMs": 60000 }
}
```

### Output (format env)

```
API_TIMEOUT_MS=60000
DATABASE_URL="postgres://api-main"
FEATURE_ENABLE_BETA=true
REDIS_URL=redis://shared
```

---

## 13. Implementation Prompt for LLM

"Act as a Senior DevOps Engineer. Based on the Zenfig specification provided, generate a TypeScript implementation with the following requirements:

1. **Core dependencies:**
   - Implement a pluggable validator interface with `effect/Schema` (default) and `zod` adapters
   - Use `@aws-sdk/client-ssm` for the default AWS SSM provider
   - Use `commander` for CLI interface

2. **Critical features:**
   - Implement all core commands: export, upsert, validate, list, delete, snapshot (save/restore)
   - Secure secret handling: Never log or print secret values unless explicitly requested
   - Partial path validation: Implement schema traversal algorithm as specified
   - Schema-directed parsing: Parse provider/CLI/file inputs into typed values before validation (no implicit coercion)
   - Error messages: Include full path, expected type, actual value, constraint details, and suggestions
   - Env flattening: Implement robust flattening with proper quoting, escaping, and type serialization
   - Merge conflict detection: Deep merge with type mismatch warnings
   - Redaction by default: Never print secret values unless explicitly requested (`--show-values`, gated for TTY)
   - Encryption verification: Verify SecureString after upsert operations

3. **Provider interface:**
   - Implement pluggable provider system with registry
   - Default aws-ssm provider with all methods (fetch, upsert, delete, verifyEncryption) using `ProviderContext`
   - Support for mock provider for testing

4. **Testing:**
   - Unit tests for schema path resolution, merge ordering, env flattening, validation
   - Integration tests for complete workflows
   - Edge case tests as specified (empty values, special characters, deep nesting, large configs)
   - Minimum 80% code coverage

5. **Error handling:**
   - Implement all error codes from Error Catalog (VAL001-005, PROV001-005, CLI001-003, SYS001-003)
   - Proper exit codes (0-5 as specified)
   - Structured error output with remediation guidance

6. **Performance considerations:**
   - Batch SSM operations (10 parameters per call)
   - Implement exponential backoff for rate limiting
   - Cache schema compilation in memory
   - Optional fetch cache for development (`--cache` flag)

7. **Security:**
   - Audit logging for mutations (upsert, delete)
   - Secure temp file handling with proper cleanup
   - Encryption verification warnings
   - Never log sensitive values by default; support explicit opt-in for showing values in diffs
   - Snapshot safety: write files with `0600` and support optional encryption at rest (`--encrypt`)

Provide complete implementation with proper TypeScript types, functional programming patterns (no classes), and comprehensive inline documentation."
