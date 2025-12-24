# Specification: Zenfig Configuration & Secrets Management Tool

## 1. Goal
Design and implement a CLI tool called **Zenfig** that orchestrates AWS SSM (via Chamber), Jsonnet, and Zod. It ensures that application configurations are logic-driven, securely retrieved, and strictly validated before reaching the runtime environment.

## 2. Technical Stack
- **Runtime:** Node.js or Bun (TypeScript).
- **Secret Retrieval:** [Chamber](https://github.com/segmentio/chamber).
- **Configuration Templating:** [Go-Jsonnet](https://github.com/google/go-jsonnet).
- **Validation:** [Zod](https://zod.dev/).
- **Process Management:** `execa` for calling system binaries.

---

## 3. Core Workflow

### A. Export Workflow (Fetch -> Process -> Validate -> Output)
1. **Fetch:** Execute `chamber export <service> --format json` to get secrets.
2. **Inject:** Pass secrets into `go-jsonnet` as External Variables (`extVar`).
3. **Template:** Evaluate `config.jsonnet` to merge secrets with static defaults/logic.
4. **Validate:** Parse the resulting JSON using a Zod schema.
5. **Format:** Convert the validated object into `.env` (flat) or `.json` (nested).

### B. Upsert Workflow (Input -> Validate -> Push)
1. **Input:** Accept a service name, key, and value.
2. **Validate:** Check the key and value against the Zod schema.
    - Verify the key exists in the schema.
    - Verify the value meets the type/constraint defined (e.g., regex, min length).
3. **Push:** If valid, execute `chamber write <service> <key> <value>`.
    - *Constraint:* Use AWS SSM `SecureString` for all writes.

---

## 4. Implementation Requirements

### Project Structure
- `src/cli.ts`: CLI entry point using `commander` or `yargs`.
- `src/schema.ts`: Exported Zod schema (the "Source of Truth").
- `src/engine.ts`: Logic for wrapping `chamber` and `jsonnet` calls.
- `src/transformer.ts`: Logic to flatten nested objects into `KEY_SUBKEY=value` strings for `.env`.

### CLI Interface
- `zenfig export <service> [--format env|json]`: Prints config to stdout.
- `zenfig upsert <service> <key> <value>`: Validates and pushes a secret.

### Validation Details
- The tool must use `ConfigSchema.partial()` or `ConfigSchema.shape[key]` to validate individual secrets during the `upsert` command without requiring the full config set to be present.

### Environment Support
- **Local:** Must look for `chamber` and `jsonnet` in the system path.
- **CI/CD:** Ensure the tool exits with `code 1` on any validation error to break the build. Use `stderr` for logs so `stdout` can be redirected to files.

---

## 5. Implementation Prompt for LLM
"Act as a Senior DevOps Engineer. Based on the Zenfig specification provided, generate a TypeScript implementation. Use `execa` for shell commands. Include a robust flattening function for the `.env` output. Ensure the `upsert` command validates the input value against the corresponding key in the Zod schema before calling Chamber. Provide the `package.json` with necessary dependencies (zod, execa, commander)."