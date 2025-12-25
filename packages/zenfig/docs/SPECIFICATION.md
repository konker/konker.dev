# Specification: Zenfig Configuration & Secrets Management Tool

## 1. Goal
Design and implement a CLI tool called **Zenfig** that orchestrates config providers, Jsonnet, and TypeBox. It ensures that application configurations are logic-driven, securely retrieved, and strictly validated before reaching the runtime environment.

## 2. Technical Stack
- **Runtime:** Node.js or Bun (TypeScript).
- **Provider (default):** [Chamber](https://github.com/segmentio/chamber) via AWS SSM.
- **Configuration Templating:** [Go-Jsonnet](https://github.com/google/go-jsonnet).
- **Validation:** [TypeBox](https://github.com/sinclairzx81/typebox) with Ajv.
- **Process Management:** `execa` for calling system binaries.

---

## 3. Core Workflow

### A. Export Workflow (Fetch -> Process -> Validate -> Output)
1. **Fetch:** Execute provider `fetch` (default: `chamber export <service> --format json`) to get secrets.
2. **Inject:** Pass secrets into `go-jsonnet` as External Variables (`extVar` / `extCode`).
3. **Template:** Evaluate `config.jsonnet` to merge secrets with static defaults/logic.
4. **Validate:** Parse the resulting JSON using a TypeBox schema (Ajv).
5. **Format:** Convert the validated object into `.env` (flat) or `.json` (nested).

### B. Upsert Workflow (Input -> Validate -> Push)
1. **Input:** Accept a service name, key, and value.
2. **Validate:** Check the key and value against the TypeBox schema.
   - Verify the key exists in the schema.
   - Verify the value meets the type/constraint defined (e.g., regex, min length).
   - Support nested keys via a path notation (`DATABASE.URL` or `database.url`).
3. **Push:** If valid, execute provider `upsert` (default: `chamber write <service> <key> <value>`).
   - *Constraint:* Use AWS SSM `SecureString` for all writes when supported by provider.

---

## 4. Provider Model (Pluggable)

### Provider Interface
- `name: string`
- `fetch(service: string): Promise<Record<string, string>>`
- `upsert(service: string, key: string, value: string): Promise<void>`
- `capabilities?: { secureWrite?: boolean }`

### Default Provider: Chamber
- Implementation uses `chamber export` and `chamber write`.
- `secureWrite` is true (writes are `SecureString` by default).

### Provider Registry
- CLI accepts `--provider <name>` (default: `chamber`).
- Registry returns provider instance by name.
- Additional provider examples (future): `aws-secretsmanager`, `vault`, `env`, `file`.

---

## 5. Configuration Contract

### Jsonnet Inputs
- `secrets`: object from provider export.
- `defaults`: optional static defaults in code or file.
- `env`: optional environment (e.g., `NODE_ENV`).

### Jsonnet Output
- Must evaluate to a JSON object compatible with the TypeBox schema.
- Non-object or invalid JSON should produce a validation error with exit code 1.

---

## 6. SSM Naming Convention
- Parameter name format: `<prefix>/<service>/<env>/<key-path>`.
- Default `prefix` is `/zenfig`, configurable via `--ssm-prefix` or `ZENFIG_SSM_PREFIX`.
- `<env>` should be sourced from `--env` or `NODE_ENV`, with `dev` as a fallback.
- `<key-path>` mirrors the schema path using `/` as a separator (e.g., `database/url`, `jwt/secret`).

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
    - Provider JSON objects (per source):
      - `api`: `{"database":{"url":"postgres://api-main"},"feature":{"enableBeta":false}}`
      - `shared`: `{"database":{"url":"postgres://shared"},"redis":{"url":"redis://shared"}}`
      - `overrides`: `{"feature":{"enableBeta":true}}`
    - Merged `secrets` (Jsonnet order: `api` + `shared` + `overrides`, last wins):
      - `{"database":{"url":"postgres://shared"},"feature":{"enableBeta":true},"redis":{"url":"redis://shared"}}`

### Jsonnet Contract
- Always pass a single `secrets` object via `--ext-code secrets=...`.
- Jsonnet is the composition layer, responsible for final shaping.

---

## 8. Implementation Requirements

### Project Structure
- `src/cli.ts`: CLI entry point using `commander` or `yargs`.
- `src/schema.ts`: Exported TypeBox schema (the "Source of Truth").
- `src/engine.ts`: Orchestrates provider, Jsonnet evaluation, and validation.
- `src/transformer.ts`: Flattens nested objects into `KEY_SUBKEY=value`.
- `src/providers/Provider.ts`: Provider interface and types.
- `src/providers/registry.ts`: Provider lookup and default selection.
- `src/providers/ChamberProvider.ts`: Provider implementation using chamber.

### CLI Interface
- `zenfig export <service> [--format env|json] [--provider name] [--jsonnet config.jsonnet]`
- `zenfig upsert <service> <key> <value> [--provider name]`
- `zenfig init [--schema src/schema.ts] [--output config.jsonnet]`: Generates an identity Jsonnet template from the TypeBox schema.

### Validation Details
- The tool must validate individual keys by resolving a schema path and validating the input value against that node.
- For nested keys, resolve a path into the TypeBox schema; validation must apply to the target node only.
- Ensure errors include the full path, expected type, and any constraint details.

### Output Formatting
- `.env` output must be deterministic and stable across runs (sorted keys).
- Arrays should be serialized (default: JSON string).
- Booleans must be `true` / `false`.
- `null` and `undefined` should be rejected unless explicitly allowed by the schema.
- Quotes should be added only when needed (e.g., spaces, `#`, `=`).
- Nested keys should be flattened using `_` as a separator with a `--separator` override.

### Jsonnet Execution
- Prefer `--ext-code` for large objects to avoid command length limits.
- Support `--jsonnet` override path for `config.jsonnet`.
- Bubble Jsonnet errors (file/line) to `stderr` and exit 1.

### Environment Support
- **Local:** Must look for `jsonnet` and provider binaries in the system path.
- **CI/CD:** Ensure the tool exits with `code 1` on any validation error to break the build.
- **Logging:** Write logs to `stderr` so `stdout` can be redirected to files.

### Style Guidelines
- Favor functional composition and pure functions where possible.
- Avoid OOP patterns such as classes, inheritance, or mutable shared state.

### Testing
- Include unit tests using Vitest for core logic (schema path resolution, merge ordering, Jsonnet input shaping, and env flattening).

### Documentation
- Provide Markdown-based documentation covering setup, CLI usage, provider configuration, and common workflows.

### Exit Codes
- `0`: success.
- `1`: validation errors, template errors, provider errors, or unknown failures.

---

## 9. Concrete Usage Example

### Example Files
`src/schema.ts`:
```ts
import { Type } from "@sinclair/typebox";

export const ConfigSchema = Type.Object({
  database: Type.Object({
    url: Type.String({ format: "uri" }),
  }),
  redis: Type.Object({
    url: Type.String({ format: "uri" }),
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
1) **Upsert new value**
```
zenfig upsert api api.timeoutMs 6500 --env prod
```
Result: writes `/zenfig/api/prod/api/timeoutMs = 6500` (validated as `Type.Integer({ minimum: 1 })`).

2) **Upsert invalid value**
```
zenfig upsert api database.url "not-a-url" --env prod
```
Result: validation error, exit code 1, no write.

3) **Export with multiple sources (merge order)**
```
zenfig export api --source shared --source overrides --env prod --format json
```

### Provider JSON (per source)
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
API_TIMEOUTMS=30000
DATABASE_URL=postgres://api-main?application_name=api
FEATURE_ENABLEBETA=true
REDIS_URL=redis://shared
```

---

## 10. Init Command Example

### Command
```
zenfig init --schema src/schema.ts --output config.jsonnet
```

### Input Schema
```ts
import { Type } from "@sinclair/typebox";

export const ConfigSchema = Type.Object({
  database: Type.Object({
    url: Type.String({ format: "uri" }),
  }),
  feature: Type.Object({
    enableBeta: Type.Boolean({ default: false }),
  }),
});
```

### Generated Identity Jsonnet
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

---

## 11. Implementation Prompt for LLM
"Act as a Senior DevOps Engineer. Based on the Zenfig specification provided, generate a TypeScript implementation. Use `execa` for shell commands. Include a robust flattening function for the `.env` output. Ensure the `upsert` command validates the input value against the corresponding key in the TypeBox schema before calling the provider. Provide the `package.json` with necessary dependencies (@sinclair/typebox, ajv, execa, commander)."
