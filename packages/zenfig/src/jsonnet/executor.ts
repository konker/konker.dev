/**
 * Jsonnet Executor
 *
 * Executes Jsonnet templates with secrets passed via temp files
 */
import * as fs from 'node:fs';

import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import { execa, type ExecaError } from 'execa';

import {
  binaryNotFoundError,
  fileNotFoundError,
  type JsonnetError,
  jsonnetInvalidOutputError,
  jsonnetMissingVariableError,
  jsonnetRuntimeError,
  jsonnetSyntaxError,
  type SystemError,
} from '../errors.js';
import { withJsonTempFile } from './tempFile.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type JsonnetInput = {
  readonly secrets: Record<string, unknown>;
  readonly env: string;
  readonly defaults?: Record<string, unknown>;
};

export type JsonnetOptions = {
  readonly templatePath: string;
  readonly timeoutMs?: number; // Default: 30000
};

// --------------------------------------------------------------------------
// Binary Check
// --------------------------------------------------------------------------

/**
 * Check if jsonnet binary is available
 */
export const checkJsonnetBinary = (): Effect.Effect<boolean, SystemError> =>
  Effect.tryPromise({
    try: async () => {
      await execa('which', ['jsonnet']);
      return true;
    },
    catch: () => binaryNotFoundError('jsonnet'),
  });

// --------------------------------------------------------------------------
// Error Parsing
// --------------------------------------------------------------------------

/**
 * Parse Jsonnet error output to extract location and message
 */
const parseJsonnetError = (stderr: string): { location: string | undefined; message: string } => {
  // Jsonnet errors typically look like:
  // RUNTIME ERROR: <message>
  //     <file>:<line>:<col>
  // or
  // <file>:<line>:<col>-<col>: <message>

  const lines = stderr.trim().split('\n');

  // Look for location pattern
  const locationPattern = /^(.+):(\d+):(\d+)/;
  const runtimePattern = /^RUNTIME ERROR:\s*(.+)/;
  const staticPattern = /^STATIC ERROR:\s*(.+)/;

  let location: string | undefined;
  let message = stderr;

  for (const line of lines) {
    const locMatch = locationPattern.exec(line);
    if (locMatch) {
      location = `${locMatch[1]}:${locMatch[2]}:${locMatch[3]}`;
    }

    const runtimeMatch = runtimePattern.exec(line);
    if (runtimeMatch) {
      message = runtimeMatch[1]!;
    }

    const staticMatch = staticPattern.exec(line);
    if (staticMatch) {
      message = staticMatch[1]!;
    }
  }

  return { location, message };
};

/**
 * Determine error type from Jsonnet error output
 */
const classifyJsonnetError = (stderr: string): JsonnetError => {
  const { location, message } = parseJsonnetError(stderr);

  // Check for missing external variable
  if (message.includes('Undefined external variable') || message.includes('Unknown variable')) {
    const varMatch = /variable[:\s]+["']?(\w+)["']?/.exec(message);
    const varName = varMatch?.[1] ?? 'unknown';
    return jsonnetMissingVariableError(varName);
  }

  // Check for syntax errors
  if (stderr.includes('STATIC ERROR') || stderr.includes('syntax error') || stderr.includes('Expected')) {
    return jsonnetSyntaxError(location ?? 'unknown', message);
  }

  // Default to runtime error
  return jsonnetRuntimeError(location ?? 'unknown', message);
};

// --------------------------------------------------------------------------
// Execution
// --------------------------------------------------------------------------

/**
 * Execute a Jsonnet template with the given input
 *
 * @param input - Secrets and environment to pass to Jsonnet
 * @param options - Execution options
 * @returns Parsed JSON output from Jsonnet
 */
export const executeJsonnet = (
  input: JsonnetInput,
  options: JsonnetOptions
): Effect.Effect<Record<string, unknown>, JsonnetError | SystemError> =>
  pipe(
    Effect.sync(() => {
      const { templatePath } = options;

      // Check template file exists
      if (!fs.existsSync(templatePath)) {
        return { exists: false as const, templatePath };
      }

      return { exists: true as const, templatePath };
    }),
    Effect.flatMap(({ exists, templatePath }) => {
      if (!exists) {
        return Effect.fail(fileNotFoundError(templatePath));
      }

      const { timeoutMs = 30000 } = options;

      // Execute with temp file for secrets
      return withJsonTempFile(input.secrets, (secretsPath) =>
        pipe(
          Effect.sync(() => {
            // Build arguments
            // Use --ext-code-file to pass secrets via temp file (safer than CLI args)
            const args = ['--ext-code-file', `secrets=${secretsPath}`, '--ext-str', `env=${input.env}`, templatePath];

            // Add defaults if provided
            if (input.defaults) {
              // For defaults, we could add another temp file, but for simplicity
              // we'll pass as ext-code (small objects are OK)
              args.unshift('--ext-code', `defaults=${JSON.stringify(input.defaults)}`);
            }

            return args;
          }),
          Effect.flatMap((args) =>
            Effect.tryPromise({
              try: async () => {
                const { stderr, stdout } = await execa('jsonnet', args, {
                  timeout: timeoutMs,
                  reject: true,
                });

                if (stderr?.trim()) {
                  // Jsonnet may write warnings to stderr
                  console.error(`[zenfig] jsonnet warning: ${stderr}`);
                }

                return stdout;
              },
              catch: (error: unknown) => {
                const execaError = error as ExecaError;

                // Check for timeout
                if (execaError.timedOut) {
                  return jsonnetRuntimeError(templatePath, `Execution timed out after ${timeoutMs}ms`);
                }

                // Check for binary not found
                if (execaError.code === 'ENOENT') {
                  return binaryNotFoundError('jsonnet');
                }

                // Parse error from stderr
                const stderrStr = String(execaError.stderr ?? execaError.message ?? 'Unknown error');
                return classifyJsonnetError(stderrStr);
              },
            })
          ),
          Effect.flatMap((result) =>
            // Parse output as JSON
            pipe(
              Effect.try({
                try: () => JSON.parse(result) as unknown,
                catch: () => jsonnetInvalidOutputError(`Invalid JSON: ${result.slice(0, 100)}`),
              }),
              Effect.flatMap((parsed) => {
                // Validate it's an object
                if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                  return Effect.fail(jsonnetInvalidOutputError(typeof parsed));
                }

                return Effect.succeed(parsed as Record<string, unknown>);
              })
            )
          )
        )
      );
    })
  );

/**
 * Evaluate a Jsonnet template and return the result
 * This is the main entry point for the export workflow
 */
export const evaluateTemplate = (
  secrets: Record<string, unknown>,
  env: string,
  templatePath: string,
  timeoutMs = 30000
): Effect.Effect<Record<string, unknown>, JsonnetError | SystemError> =>
  executeJsonnet({ secrets, env }, { templatePath, timeoutMs });
