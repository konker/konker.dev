# Specification: Zenfig Configuration & Secrets Management Tool

## 1. Goal

Design and implement a CLI tool called **Zenfig** that orchestrates config providers, Jsonnet, and TypeBox. It ensures that application configurations are logic-driven, securely retrieved, and strictly validated before reaching the runtime environment.

## 2. Technical Stack

- **Runtime:** Node.js or Bun (TypeScript).
- **Provider (default):** AWS SSM via the AWS SDK (`aws-ssm` provider).
- **Configuration Templating:** [Go-Jsonnet](https://github.com/google/go-jsonnet).
- **Validation:** [TypeBox](https://github.com/sinclairzx81/typebox) with Ajv.
- **Process Management:** `execa` for calling system binaries.

---

## 3. Core Workflow

### Core Concepts (Layers, Paths, and Values)

Zenfig operates on two related but distinct layers of configuration data:

1. **Stored values (provider layer):** Key/value strings persisted in the backing store (default: AWS SSM) under a `<prefix>/<service>/<env>/...` hierarchy.
2. **Rendered config (runtime layer):** The final, schema-valid configuration object produced by evaluating `config.jsonnet` with fetched values plus logic/defaults.

Zenfig uses a **canonical key path** for CLI and internal operations:

- Canonical form: dot notation using schema property names, e.g. `api.timeoutMs`.
- Input is case-sensitive; key segments must match the schema-defined property casing exactly.
- Dots are path separators; schema keys that literally contain `.` or `/` are not supported (must be modeled differently).
- Each key segment must match `^[A-Za-z0-9_-]+$` (no whitespace or other punctuation).

Key path representations:

- **Canonical (dot):** `api.timeoutMs`
- **SSM key-path (slash):** `api/timeoutMs` (used in `<prefix>/<service>/<env>/<key-path>`)
- **`.env` key:** `API_TIMEOUT_MS` by default (uppercase + snake_case; separator configurable)

Stored value encoding (provider strings) is schema-directed:

- `Type.String`: stored as-is (no JSON quoting)
- `Type.Boolean`: `true` / `false`
- `Type.Integer` / `Type.Number`: base-10 numeric string (e.g. `6500`, `0.25`)
- `Type.Array` / `Type.Object`: minified JSON (e.g. `["a","b"]`, `{"k":"v"}`)

By default, Zenfig does not print secret values in logs or diffs unless explicitly requested via an opt-in flag.

### A. Export Workflow (Fetch -> Process -> Validate -> Output)

1. **Fetch:** Retrieve stored values from the provider for the primary service and any `--source` services.
   - Default (AWS SSM): `GetParametersByPath` under `<prefix>/<service>/<env>` (via AWS SDK).
   - Provider returns a flat map of canonical key paths to **string** values.
2. **Parse + Merge:** Convert provider strings into typed values using the schema (schema-directed parsing) and deep-merge all sources.
3. **Inject:** Pass the merged, typed `secrets` object into `go-jsonnet` as External Variables via temp file or stdin (not CLI args).
4. **Template:** Evaluate `config.jsonnet` to produce the rendered config (may apply defaults/derivations/clamps).
5. **Validate:** Validate the rendered config against the TypeBox schema (Ajv).
6. **Format:** Convert the validated object into `.env` (flat) or `.json` (nested).

### B. Upsert Workflow (Input -> Validate -> Push)

1. **Input:** Accept a service name, key, and value (via CLI args or stdin for sensitive values).
2. **Resolve:** Locate the target schema node using partial path resolution (dot notation; case-sensitive input).
3. **Parse + Validate:** Parse the input string into a typed value based on the resolved schema node, then validate with Ajv.
   - Strings are not auto-coerced to numbers/booleans; parsing is schema-directed.
   - Arrays/objects require JSON input (validated and then stored as minified JSON).
4. **Serialize:** Convert the typed value back into the provider string encoding (see Stored value encoding).
5. **Push:** If valid, execute provider `upsert` (default AWS SSM: `PutParameter` to `<prefix>/<service>/<env>/<key-path>` with `SecureString`).
   - _Constraint:_ Use AWS SSM `SecureString` for all writes when supported by provider.
   - Verify encryption type post-write and warn if not SecureString.

### C. Diff Workflow (Fetch -> Render -> Compare -> Report)

Diff compares **stored values** (what’s in the provider) with the **rendered config** (what applications consume after Jsonnet).

1. **Fetch:** Retrieve current stored values via provider `fetch`.
2. **Render:** Generate rendered config using the export workflow (in-memory, no external output).
3. **Compare:** Flatten both sides to canonical key paths and compute added/removed/modified keys.
4. **Report:** Output changes.
   - Default output is **redacted** (no secret values printed).
   - Optional: `--show-values` prints values (TTY-only; otherwise require `--unsafe-show-values`).
   - Exit code 0 if no differences, 1 if differences found.

### D. Validate Workflow (Input -> Parse -> Validate)

1. **Input:** Accept file path to JSON or `.env` file via `--file`.
2. **Parse:** Load and parse the file contents (JSON or env format auto-detected).
3. **Validate:** Apply full TypeBox schema validation.
4. **Report:** Output validation errors with full paths, expected types, constraints, and suggestions.
   - Exit code 0 if valid, 1 if invalid.

### E. Delete Workflow (Input -> Validate -> Confirm -> Remove)

1. **Input:** Accept service name and key path via CLI.
2. **Validate:** Check key exists in schema (warn if not, but allow deletion).
3. **Confirm:** Require `--confirm` flag or interactive `y/N` prompt for safety (no prompts in `--ci` / non-TTY mode).
4. **Remove:** Execute provider `delete` (default AWS SSM: `DeleteParameter` on `<prefix>/<service>/<env>/<key-path>`).
5. **Audit:** Log deletion with timestamp, user, and key to stderr (values are redacted by default).

### F. Snapshot Workflow

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

### G. Doctor Workflow (Check -> Report)

1. **Check binaries:** Verify `jsonnet` is available in `PATH`.
2. **Check files:** Verify schema and Jsonnet template paths exist and are readable.
3. **Check schema loading:** Verify the schema file can be loaded and contains the configured export name.
4. **Optional provider check:** If credentials are available, perform a read-only provider `fetch` and report counts only (never values).

---

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
- Provider maps `ProviderContext` to an SSM path root of `<prefix>/<service>/<env>` and maps `keyPath` (`a.b.c`) to a parameter key path (`a/b/c`).
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

## 5. Configuration Contract

### Jsonnet Inputs

- `secrets`: merged, typed object constructed from provider `fetch` results after schema-directed parsing and multi-source merge.
- `defaults`: optional static defaults (object) in code or file.
- `env`: environment name (string), typically sourced from `--env` / `ZENFIG_ENV` / `NODE_ENV`.

### Jsonnet Output

- Must evaluate to a JSON object compatible with the TypeBox schema.
- Non-object or invalid JSON should produce a validation error with exit code 1.

---

## 6. SSM Naming Convention

- Parameter name format: `<prefix>/<service>/<env>/<key-path>`.
- Default `prefix` is `/zenfig`, configurable via `--ssm-prefix` or `ZENFIG_SSM_PREFIX`.
- `<env>` should be sourced from `--env`, `ZENFIG_ENV`, or `NODE_ENV`, with `dev` as a fallback.
- `<key-path>` mirrors the schema path using `/` as a separator (e.g., `database/url`, `jwt/secret`).
- Each key segment must match `^[A-Za-z0-9_-]+$`; no encoding is applied.
- Service, env, and key segments are case-sensitive and must be used consistently.
- Zenfig uses canonical dot paths in the CLI (`database.url`) and providers translate dot paths to backend naming (`database/url` for SSM).

---

## 7. Multi-Source Composition

Zenfig may compose multiple SSM roots into a single config output.

### CLI Input

- `zenfig export <service> [--source <service>]...` to include additional services.
- Each source resolves to `<prefix>/<service>/<env>/...` and is fetched independently.

### Merge Semantics

- All sources are merged into a single `secrets` object.
- Merge order follows Jsonnet semantics (later sources override earlier keys).
- Precedence order is: primary `<service>` first, then each `--source` in the order provided.
  - Example: `zenfig export api --source shared --source overrides`
    - SSM paths fetched (with `--env prod` and default prefix `/zenfig`):
      - `/zenfig/api/prod/database/url = postgres://api-main`
      - `/zenfig/api/prod/feature/enableBeta = false`
      - `/zenfig/shared/prod/database/url = postgres://shared`
      - `/zenfig/shared/prod/redis/url = redis://shared`
      - `/zenfig/overrides/prod/feature/enableBeta = true`
    - Parsed secrets objects (per source, after schema-directed parsing + unflattening):
      - `api`: `{"database":{"url":"postgres://api-main"},"feature":{"enableBeta":false}}`
      - `shared`: `{"database":{"url":"postgres://shared"},"redis":{"url":"redis://shared"}}`
      - `overrides`: `{"feature":{"enableBeta":true}}`
    - Merged `secrets` (Jsonnet order: `api` + `shared` + `overrides`, last wins):
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

### Jsonnet Contract

- Always pass a single `secrets` object via temp file (e.g., `--ext-code secrets=@/tmp/zenfig-secrets.json`).
- Never pass secrets via command-line arguments to prevent exposure in process lists.
- Jsonnet is the composition layer, responsible for final shaping.

---

## 8. Implementation Requirements

### Implementation Conventions

- Follow the conventions used by other packages and apps in the monorepo (e.g., TypeScript config, Vitest config, linting, and project layout).
- Use Effect.ts in line with other packages in the monorepo, and implement logic using pipe-based Effect composition only (no generator-based `Effect.gen`).

### Project Structure

- `src/cli.ts`: CLI entry point using `commander` or `yargs`.
- `src/schema.ts`: Exported TypeBox schema (the "Source of Truth").
- `src/engine.ts`: Orchestrates provider, Jsonnet evaluation, and validation.
- `src/transformer.ts`: Flattens nested objects into `KEY_SUBKEY=value`.
- `src/providers/Provider.ts`: Provider interface and types.
- `src/providers/registry.ts`: Provider lookup and default selection.
- `src/providers/AwsSsmProvider.ts`: Provider implementation using AWS SSM.

### CLI Interface

#### Core Commands

````bash
# Global options (available on all commands)
  --ci                        # Disable prompts; require explicit flags like --confirm
  --strict                    # Treat warnings as errors (e.g., unknown keys)

# Export configuration
zenfig export <service> [options]
  --source <service>          # Additional sources (repeatable)
  --format <env|json>         # Output format (default: env)
  --provider <name>           # Provider name (default: aws-ssm)
  --jsonnet <path>            # Jsonnet template path (default: config.jsonnet)
  --jsonnet-timeout <ms>      # Kill jsonnet after timeout (default: 30000)
  --env <environment>         # Environment name (overrides NODE_ENV)
  --separator <char>          # Env key separator (default: _)
  --strict-merge              # Fail on type conflicts during merge
  --warn-on-override          # Log all key overrides
  --cache <duration>          # Cache provider fetches (e.g., 30s, 5m; dev-only)
  --no-cache                  # Disable cache even if configured
  --ssm-prefix <prefix>       # SSM path prefix (default: /zenfig)

# Upsert configuration value
zenfig upsert <service> <key> [value] [options]
  --provider <name>           # Provider name (default: aws-ssm)
  --env <environment>         # Environment name (overrides NODE_ENV)
  --stdin                     # Read value from stdin (for sensitive data)
  --type <auto|string|int|float|bool|json>  # How to parse input before validation (default: auto)
  --skip-encryption-check     # Skip encryption verification (not recommended)
  --ssm-prefix <prefix>       # SSM path prefix (default: /zenfig)

# Validate configuration file
zenfig validate [options]
  --file <path>               # Path to JSON or .env file
  --schema <path>             # Schema path (default: src/schema.ts)
  --schema-export-name <name> # Schema export name (default: ConfigSchema)
  --format <env|json>         # File format (auto-detected if not specified)

# Show diff between stored values and rendered config
zenfig diff <service> [options]
  --source <service>          # Additional sources (repeatable)
  --format <json|table>       # Output format (default: table)
  --provider <name>           # Provider name (default: aws-ssm)
  --jsonnet <path>            # Jsonnet template path (default: config.jsonnet)
  --jsonnet-timeout <ms>      # Kill jsonnet after timeout (default: 30000)
  --env <environment>         # Environment name (overrides NODE_ENV)
  --show-values               # Print secret values (TTY only; use --unsafe-show-values for CI)
  --unsafe-show-values        # Allow printing secrets even when stdout is not a TTY (dangerous)
  --cache <duration>          # Cache provider fetches (e.g., 30s, 5m; dev-only)
  --no-cache                  # Disable cache even if configured
  --ssm-prefix <prefix>       # SSM path prefix (default: /zenfig)

# List configuration keys
zenfig list <service> [options]
  --provider <name>           # Provider name (default: aws-ssm)
  --env <environment>         # Environment name (overrides NODE_ENV)
  --format <keys|table|json>  # Output format (default: keys)
  --show-values               # Print secret values (TTY only; use --unsafe-show-values for CI)
  --unsafe-show-values        # Allow printing secrets even when stdout is not a TTY (dangerous)
  --ssm-prefix <prefix>       # SSM path prefix (default: /zenfig)

Examples:

```bash
# List all keys (redacted values)
zenfig list api --env prod

# List keys with values in JSON format (local dev only)
zenfig list api --env prod --format json --show-values
````

# Delete configuration value

zenfig delete <service> <key> [options]
--provider <name> # Provider name (default: aws-ssm)
--env <environment> # Environment name (overrides NODE_ENV)
--confirm # Skip interactive confirmation
--ssm-prefix <prefix> # SSM path prefix (default: /zenfig)

# Save configuration snapshot

zenfig snapshot save <service> [options]
--source <service> # Additional sources (repeatable)
--provider <name> # Provider name (default: aws-ssm)
--env <environment> # Environment name (overrides NODE_ENV)
--output <path> # Output path (default: .zenfig/snapshots/)
--encrypt # Encrypt snapshot at rest (recommended)
--snapshot-key-file <path> # Read encryption key from file (preferred over CLI args)
--ssm-prefix <prefix> # SSM path prefix (default: /zenfig)

# Restore configuration from snapshot

zenfig snapshot restore <snapshot-file> [options]
--provider <name> # Provider name (default: aws-ssm)
--dry-run # Show diff without applying changes
--force-schema-mismatch # Allow restore despite schema hash mismatch
--confirm # Skip interactive confirmation
--show-values # Print secret values in diff output (TTY only)
--unsafe-show-values # Allow printing secrets even when stdout is not a TTY (dangerous)
--ssm-prefix <prefix> # SSM path prefix (default: /zenfig)

# Initialize Jsonnet template from schema

zenfig init [options]
--schema <path> # Schema path (default: src/schema.ts)
--schema-export-name <name> # Schema export name (default: ConfigSchema)
--output <path> # Output path (default: config.jsonnet)
--force # Overwrite existing file
--include-defaults # Include schema defaults in template

# Check local prerequisites and basic connectivity

zenfig doctor [options]
--provider <name> # Provider name (default: aws-ssm)
--schema <path> # Schema path (default: src/schema.ts)
--schema-export-name <name> # Schema export name (default: ConfigSchema)
--jsonnet <path> # Jsonnet template path (default: config.jsonnet)

````

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
- `ZENFIG_SCHEMA_EXPORT_NAME`: Default schema export name (default: `ConfigSchema`)
- `ZENFIG_JSONNET`: Default Jsonnet template path
- `ZENFIG_JSONNET_TIMEOUT_MS`: Default Jsonnet timeout in ms
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
  "schemaExportName": "ConfigSchema",
  "jsonnet": "config.jsonnet",
  "sources": ["shared", "overrides"],
  "format": "env",
  "separator": "_",
  "cache": "5m",
  "jsonnetTimeoutMs": 30000,
  "providerGuards": {
    "aws-ssm": {
      "accountId": "123456789012",
      "region": "us-east-1"
    }
  }
}
````

Rules:

- `zenfigrc.json`/`zenfigrc.json5` must not contain secrets.
- CLI flags override environment variables, which override `zenfigrc.json`/`zenfigrc.json5`, which override defaults.
- Unknown keys should be ignored with a warning (or error in `--strict` mode).

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

#### Partial Path Resolution

- Keys use dot notation (e.g., `database.url`, `api.timeoutMs`).
- Path resolution is case-sensitive; input must match schema-defined property casing.
- Schema paths are traversed recursively to find the target node and compute the canonical key path.
- Algorithm:
  1. Split key by `.` into segments (e.g., `database.url` → `["database", "url"]`)
  2. Reject any segment that does not match `^[A-Za-z0-9_-]+$`
  3. Starting from schema root, traverse each segment:
     - If current node is `Type.Object`, look for a property whose name matches the segment exactly
     - If segment not found, error: `Key 'database.url' not found in schema`
  4. At final segment, extract the TypeBox type (e.g., `Type.String({ format: "uri" })`)
  5. Validate value against extracted type using Ajv
- Example validation for `database.url`:
  ```ts
  // Schema: Type.Object({ database: Type.Object({ url: Type.String({ format: "uri" }) }) })
  // Key: "database.url"
  // Segments: ["database", "url"]
  // Resolved type: Type.String({ format: "uri" })
  // Value: "postgres://localhost:5432/mydb"
  // Result: Valid ✓
  ```

#### Schema-Directed Value Parsing

Zenfig parses provider strings and CLI/file inputs into typed values **before** validation. Ajv type coercion should be disabled; parsing is explicit and schema-driven.

Parsing rules (by resolved schema node):

- `Type.String`: keep as string (no implicit JSON parsing)
- `Type.Boolean`: accept `true`/`false` (case-insensitive), parse to boolean
- `Type.Integer`: parse base-10 integer; reject decimals/NaN/Infinity
- `Type.Number`: parse number; reject NaN/Infinity
- `Type.Array` / `Type.Object`: require JSON input; parse with `JSON.parse`
- `Type.Union`: attempt each branch’s parsing strategy in schema order and validate; choose the first branch that validates

For `upsert`, `--type` can override parsing:

- `--type string`: treat input as raw string even if the schema is not `Type.String` (validation will likely fail unless schema accepts string)
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
  - **null:** Error (not allowed unless schema explicitly permits via `Type.Union([Type.Null(), ...])`)
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
  - Allow `null` explicitly via `Type.Union([Type.Null(), ...])` (optional fields only affect `undefined`, not `null`)
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

### Jsonnet Execution

- Prefer `--ext-code` for large objects to avoid command length limits.
- Support `--jsonnet` override path for `config.jsonnet`.
- Support `--jsonnet-timeout <ms>` to abort long-running templates.
- Bubble Jsonnet errors (file/line) to `stderr` and exit 1.

### Environment Support

- **Local:** Must look for `jsonnet` in the system path; `aws-ssm` uses the AWS SDK (no provider binary).
- **CI/CD:** Ensure the tool exits with `code 1` on any validation error to break the build.
- **Non-interactive:** In `--ci` / `ZENFIG_CI=1` mode (or when stdin is not a TTY), never prompt; require explicit flags like `--confirm`.
- **Logging:** Write logs to `stderr` so `stdout` can be redirected to files; never print secret values by default.

### Security Requirements

- **Redaction by default:** Commands must not print secret values unless explicitly requested via `--show-values` (and must support redaction even in structured outputs like JSON).
- **Safe secret handling:** Never pass secrets via command-line arguments to child processes; use temp files/stdin for Jsonnet/provider calls.
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

5. **Jsonnet input shaping:**
   - Secrets object construction
   - Temp file creation and cleanup
   - External variable injection

#### Integration Tests

Test complete workflows with real dependencies:

1. **Export workflow:**
   - Mock aws-ssm provider
   - Real jsonnet execution
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

4. **Diff workflow:**
   - Detect added/removed/modified keys
   - Format outputs (JSON, table)
   - Exit code behavior

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

7. **Jsonnet edge cases:**
   - Syntax errors in template
   - Runtime errors (division by zero, etc.)
   - Infinite loops (timeout)
   - Missing std.extVar
   - Returning non-object (string, array, null)

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
- `1`: Validation/template errors, diff differences found (when enabled), or non-auth provider operation failures
- `2`: Configuration errors (invalid flags, missing required args)
- `3`: File not found or permission errors
- `4`: Provider connection, authentication, or authorization errors
- `5`: Schema compatibility errors (snapshot restore with mismatched schema)

Default mapping:

- `CLI*` → exit `2`
- `SYS001`/`SYS002`/`SYS003` → exit `3`
- `PROV001`/`PROV002`/`PROV005` → exit `4`
- `SYS004` → exit `5` (unless forced)
- All other errors → exit `1`

---

## 9. Error Catalog

### Error Code Structure

Each error has:

- **Code:** Unique identifier (e.g., `VAL001`, `PROV002`)
- **Category:** Validation, Provider, Jsonnet, CLI, System
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

  Remediation: Provide a non-null value or use Type.Union([Type.Null(), ...]) in schema
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

- Verify parameter path: `<prefix>/<service>/<env>/<key>`
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

### Jsonnet Errors (JSON)

#### JSON001: Syntax Error

**Message:** `Jsonnet template has syntax error`
**Example:**

```
Jsonnet Error [JSON001]: config.jsonnet:12:5

  Problem:  Expected '}' but found ','

  Line 12:  enableBeta: true,
                           ^
  Remediation: Fix syntax error in Jsonnet template
```

#### JSON002: Runtime Error

**Message:** `Jsonnet template failed during evaluation`
**Example:**

```
Jsonnet Error [JSON002]: config.jsonnet:15:18

  Problem:  Division by zero

  Line 15:  timeout: s.api.max / s.api.divisor
                                   ^
  Remediation: Check logic in Jsonnet template
```

#### JSON003: Invalid Output

**Message:** `Jsonnet did not return a valid object`
**Example:**

```
Jsonnet Error [JSON003]

  Expected: JSON object
  Received: string "hello"
  Problem:  Jsonnet must evaluate to an object, not a primitive

  Remediation: Ensure Jsonnet returns { ... } object structure
```

#### JSON004: Missing External Variable

**Message:** `Required external variable not provided`
**Remediation:**

- Ensure `secrets` and `env` are passed via `--ext-code`
- Check temp file creation succeeded

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

#### SYS001: Binary Not Found

**Message:** `Required binary not found in PATH`
**Remediation:**

- Install `jsonnet`: `brew install go-jsonnet` or build from source
- No provider binary required for `aws-ssm`
- Verify binary is in PATH: `which jsonnet`

#### SYS002: File Not Found

**Message:** `Required file does not exist`
**Remediation:**

- Check file path is correct
- Verify file permissions (readable)
- For schema: Ensure `src/schema.ts` exports `ConfigSchema`

#### SYS003: Permission Denied

**Message:** `Insufficient filesystem permissions`
**Remediation:**

- Check file/directory permissions
- Verify write access for snapshot directory (`.zenfig/snapshots/`)

#### SYS004: Snapshot Schema Mismatch

**Message:** `Snapshot schema hash does not match current schema`
**Severity:** Error by default (warning if forced)
**Remediation:**

- Review schema changes since snapshot was created
- Use `--force-schema-mismatch` to restore anyway (may cause validation errors)
- Regenerate snapshot with current schema

---

## 10. Performance Characteristics

### Operational Limits

- **Maximum config size:** 10,000 keys per service (SSM API limit: 10,000 parameters per path)
- **Maximum value size:** 8 KB per value (SSM SecureString limit)
- **Maximum nesting depth:** 20 levels (practical limit for readability)
- **Maximum sources:** 50 sources per export (to avoid excessive merge complexity)
- **Jsonnet execution timeout:** 30 seconds (configurable via `--jsonnet-timeout`)

### Expected Latency

All timings assume AWS us-east-1 region, warm IAM credentials:

| Operation                | Avg Latency | P95 Latency | Notes                                         |
| ------------------------ | ----------- | ----------- | --------------------------------------------- |
| `export` (10 keys)       | 400ms       | 800ms       | Dominated by SSM GetParameters API call       |
| `export` (100 keys)      | 600ms       | 1.2s        | Batch fetching reduces overhead               |
| `export` (1000 keys)     | 2s          | 4s          | Multiple batch API calls required             |
| `upsert`                 | 300ms       | 600ms       | Single PutParameter + encryption verification |
| `validate` (local file)  | 50ms        | 100ms       | Pure compute, no I/O                          |
| `diff`                   | 500ms       | 1s          | Fetch + export + compare                      |
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

- Cache compiled Ajv validator in memory for duration of CLI process
- Reuse across multiple validations (e.g., snapshot restore with 100 keys)
- No disk cache (schema changes should be reflected immediately)

**Provider fetch cache:**

- No caching by default (always fetch fresh values)
- Optional `--cache <duration>` flag for development (e.g., `--cache 5m`)
- Cache key: `<provider>:<service>:<env>:<sources-hash>`
- Cache storage: Temp directory (`.zenfig/cache/`)
- Cache invalidation: Age-based (TTL) or manual (`--no-cache` flag)

**Jsonnet evaluation cache:**

- No caching (templates may have side effects or time-based logic)
- Fast enough (<100ms for typical templates) to not require caching

### Optimization Recommendations

1. **Large configs (1000+ keys):**
   - Use `--format json` for export (faster than env flattening)
   - Consider splitting into multiple services (logical grouping)
   - Use snapshot restore instead of individual upserts for bulk updates

2. **CI/CD pipelines:**
   - Cache Jsonnet binary in CI image
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
- **Jsonnet evaluation:** +20 MB temporary allocation
- **Peak:** ~100 MB for typical workloads (100-500 keys)
- **Large configs (5000+ keys):** ~200 MB

### Disk Usage

- **Snapshots:** ~1 KB per 10 keys (JSON format)
- **Cache (if enabled):** ~500 bytes per key
- **Logs:** Negligible (stderr only, no persistent logs)

---

## 11. Concrete Usage Example

### Example Files

`src/schema.ts`:

```ts
import { Type } from '@sinclair/typebox';

export const ConfigSchema = Type.Object({
  database: Type.Object({
    url: Type.String({ format: 'uri' }),
  }),
  redis: Type.Object({
    url: Type.String({ format: 'uri' }),
  }),
  feature: Type.Object({
    enableBeta: Type.Boolean({ default: false }),
  }),
  api: Type.Object({
    timeoutMs: Type.Integer({ minimum: 1, default: 5000 }),
  }),
});
```

`config.jsonnet`:

```jsonnet
local s = std.extVar("secrets");
local env = std.extVar("env");
local timeoutMs = std.min([std.max([std.get(s.api, "timeoutMs", 5000), 1000]), 30000]);
local databaseUrl = s.database.url + "?application_name=api";
{
  database: {
    url: databaseUrl,
  },
  redis: {
    url: std.get(s.redis, "url", "redis://localhost:6379"),
  },
  feature: {
    enableBeta: s.feature.enableBeta || env == "staging",
  },
  api: {
    timeoutMs: timeoutMs,
  },
}
```

### SSM State (Initial)

- `/zenfig/api/prod/database/url = postgres://api-main`
- `/zenfig/api/prod/feature/enableBeta = false`
- `/zenfig/shared/prod/redis/url = redis://shared`
- `/zenfig/shared/prod/api/timeoutMs = 60000`
- `/zenfig/overrides/prod/feature/enableBeta = true`

### Steps

1. **Upsert new value**

```
zenfig upsert api api.timeoutMs 6500 --env prod
```

Result: writes `/zenfig/api/prod/api/timeoutMs = 6500` (validated as `Type.Integer({ minimum: 1 })`).

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

5. **Diff stored vs rendered config**

```bash
# Check for configuration drift in production
zenfig diff api --source shared --source overrides --env prod --format table
```

Result: Shows differences between stored values (provider layer) and rendered config (Jsonnet). Output is redacted by default; use `--show-values` for local debugging.

```
┌─────────────────┬───────────────────────────────┬───────────────────────────────┬──────────┐
│ Key             │ Stored (Provider)             │ Rendered (Jsonnet)            │ Status   │
├─────────────────┼───────────────────────────────┼───────────────────────────────┼──────────┤
│ api.timeoutMs   │ <redacted>                    │ <redacted>                    │ Modified │
│ feature.newFlag │ (not set)                     │ <redacted>                    │ Added    │
│ legacy.setting  │ <redacted>                    │ (removed)                     │ Removed  │
└─────────────────┴───────────────────────────────┴───────────────────────────────┴──────────┘
```

Exit code: 1 (differences found)

6. **List stored keys**

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

7. **Delete configuration value**

```bash
# Remove deprecated config key
zenfig delete api legacy.setting --env prod --confirm
```

Result: Deletes `/zenfig/api/prod/legacy/setting`, logs deletion with timestamp.

8. **Save configuration snapshot**

```bash
# Backup production config before major change
zenfig snapshot save api --source shared --env prod
```

Result: Saves to `.zenfig/snapshots/api-prod-2024-01-15T10-30-00.json` with metadata.

9. **Restore configuration from snapshot**

```bash
# Rollback to previous snapshot after failed deployment
zenfig snapshot restore .zenfig/snapshots/api-prod-2024-01-15T10-30-00.json --dry-run
```

Result: Shows diff of what would change, requires `--confirm` to apply.

10. **Upsert with stdin (secure)**

```bash
# Set sensitive value without exposing in process list
echo "supersecret" | zenfig upsert api jwt.secret --stdin --env prod
```

Result: Writes `/zenfig/api/prod/jwt/secret` as SecureString, verifies encryption.

### Parsed Secrets (per source)

- `api`:
  `{"database":{"url":"postgres://api-main"},"feature":{"enableBeta":false},"api":{"timeoutMs":6500}}`
- `shared`:
  `{"redis":{"url":"redis://shared"},"api":{"timeoutMs":60000}}`
- `overrides`:
  `{"feature":{"enableBeta":true}}`

### Merged Secrets (Jsonnet Order: api + shared + overrides)

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
  "database": { "url": "postgres://api-main?application_name=api" },
  "redis": { "url": "redis://shared" },
  "feature": { "enableBeta": true },
  "api": { "timeoutMs": 30000 }
}
```

### Output (format env)

```
API_TIMEOUT_MS=30000
DATABASE_URL="postgres://api-main?application_name=api"
FEATURE_ENABLE_BETA=true
REDIS_URL=redis://shared
```

---

## 12. Init Command Specification

### Basic Usage

```bash
zenfig init --schema src/schema.ts --output config.jsonnet
```

### Input Schema Example

```ts
import { Type } from '@sinclair/typebox';

export const ConfigSchema = Type.Object({
  database: Type.Object({
    url: Type.String({ format: 'uri' }),
  }),
  feature: Type.Object({
    enableBeta: Type.Boolean({ default: false }),
  }),
});
```

### Generated Identity Jsonnet (Default)

```jsonnet
local s = std.extVar("secrets");
{
  database: {
    url: s.database.url,
  },
  feature: {
    enableBeta: s.feature.enableBeta,
  },
}
```

### Edge Cases and Behaviors

#### 1. Output File Already Exists

**Scenario:** `config.jsonnet` already exists
**Default behavior:** Error and exit (do not overwrite)

```
Error: Output file already exists: config.jsonnet
Use --force to overwrite
```

**With `--force` flag:** Overwrite existing file with warning

```
Warning: Overwriting existing file: config.jsonnet
```

#### 2. Include Schema Defaults

**With `--include-defaults` flag:**

```jsonnet
local s = std.extVar("secrets");
{
  database: {
    url: s.database.url,
  },
  feature: {
    // Schema default: false
    enableBeta: std.get(s.feature, "enableBeta", false),
  },
}
```

Comments indicate which fields have defaults, and `std.get` provides fallback values.

#### 3. Optional Fields

**Schema with optional fields:**

```ts
export const ConfigSchema = Type.Object({
  database: Type.Object({
    url: Type.String({ format: 'uri' }),
    pool: Type.Optional(
      Type.Object({
        max: Type.Integer({ minimum: 1, default: 10 }),
      })
    ),
  }),
});
```

**Generated Jsonnet (default):**

```jsonnet
local s = std.extVar("secrets");
{
  database: {
    url: s.database.url,
    pool: if std.objectHas(s.database, "pool") then {
      max: s.database.pool.max,
    } else {},
  },
}
```

**Generated Jsonnet (with `--include-defaults`):**

```jsonnet
local s = std.extVar("secrets");
{
  database: {
    url: s.database.url,
    pool: if std.objectHas(s.database, "pool") then {
      // Schema default: 10
      max: std.get(s.database.pool, "max", 10),
    } else {},
  },
}
```

#### 4. Arrays in Schema

**Schema with arrays:**

```ts
export const ConfigSchema = Type.Object({
  allowedOrigins: Type.Array(Type.String({ format: 'uri' })),
});
```

**Generated Jsonnet:**

```jsonnet
local s = std.extVar("secrets");
{
  allowedOrigins: s.allowedOrigins,
}
```

#### 5. Union Types

**Schema with unions:**

```ts
export const ConfigSchema = Type.Object({
  timeout: Type.Union([Type.Integer({ minimum: 0 }), Type.Literal('infinity')]),
});
```

**Generated Jsonnet:**

```jsonnet
local s = std.extVar("secrets");
{
  // Union type: integer | "infinity"
  timeout: s.timeout,
}
```

Comment indicates the union type for clarity.

#### 6. Nested Objects (Deep)

**Schema with deep nesting:**

```ts
export const ConfigSchema = Type.Object({
  database: Type.Object({
    connection: Type.Object({
      pool: Type.Object({
        min: Type.Integer({ minimum: 0, default: 2 }),
        max: Type.Integer({ minimum: 1, default: 10 }),
      }),
    }),
  }),
});
```

**Generated Jsonnet (with `--include-defaults`):**

```jsonnet
local s = std.extVar("secrets");
{
  database: {
    connection: {
      pool: {
        // Schema default: 2
        min: std.get(s.database.connection.pool, "min", 2),
        // Schema default: 10
        max: std.get(s.database.connection.pool, "max", 10),
      },
    },
  },
}
```

#### 7. Schema File Not Found

**Scenario:** Schema file doesn't exist
**Behavior:** Error with helpful message

```
Error [SYS002]: Schema file not found: src/schema.ts

Remediation:
  - Check file path is correct
  - Ensure schema exports 'ConfigSchema'
  - Example schema:
      import { Type } from "@sinclair/typebox";
      export const ConfigSchema = Type.Object({ ... });
```

#### 8. Schema Export Name Mismatch

**Scenario:** Schema file doesn't export `ConfigSchema`
**Behavior:** Error with discovery

```
Error: 'ConfigSchema' not found in src/schema.ts

Found exports: MySchema, AppConfig

Remediation: Rename export to 'ConfigSchema' or use --schema-export-name flag
Example: zenfig init --schema src/schema.ts --schema-export-name AppConfig
```

#### 9. Output Directory Doesn't Exist

**Scenario:** `--output deep/nested/config.jsonnet` where `deep/nested/` doesn't exist
**Behavior:** Create parent directories automatically (like `mkdir -p`)

```
Info: Creating directory: deep/nested/
Generated: deep/nested/config.jsonnet
```

#### 10. Schema Validation

**Scenario:** Schema file has syntax errors or invalid TypeBox usage
**Behavior:** Error with TypeScript/parsing error details

```
Error: Failed to parse schema file: src/schema.ts

  Problem:  Unexpected token '}' at line 15

Remediation: Fix syntax error in schema file
```

---

## 13. Implementation Prompt for LLM

"Act as a Senior DevOps Engineer. Based on the Zenfig specification provided, generate a TypeScript implementation with the following requirements:

1. **Core dependencies:**
   - Use `execa` for shell command execution (jsonnet binary)
   - Use `@sinclair/typebox` and `ajv` for schema validation
   - Use `@aws-sdk/client-ssm` for the default AWS SSM provider
   - Use `commander` for CLI interface
   - Use `chalk` for colored terminal output
   - Use `cli-table3` for table formatting (diff command)

2. **Critical features:**
   - Implement all core commands: export, upsert, validate, diff, delete, snapshot (save/restore), init, doctor
   - Secure secret passing: Use temp files for secrets, never pass via CLI args
   - Partial path validation: Implement schema traversal algorithm as specified
   - Schema-directed parsing: Parse provider/CLI/file inputs into typed values before validation (no Ajv coercion)
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
   - Implement all error codes from Error Catalog (VAL001-005, PROV001-005, JSON001-004, CLI001-003, SYS001-004)
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
