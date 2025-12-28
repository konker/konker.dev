/**
 * Secure Temp File Handling
 *
 * Creates and manages temporary files for passing secrets to Jsonnet
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { permissionDeniedError, type SystemError } from '../errors.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type TempFile = {
  readonly path: string;
  readonly cleanup: () => Effect.Effect<void, never>;
};

// --------------------------------------------------------------------------
// Temp File Creation
// --------------------------------------------------------------------------

/**
 * Generate a unique temp file path
 */
function generateTempPath(prefix = 'zenfig-'): string {
  const tmpDir = os.tmpdir();
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return path.join(tmpDir, `${prefix}${uniqueId}.json`);
}

/**
 * Create a secure temp file with the given content
 *
 * @param content - Content to write to the file
 * @param prefix - File name prefix (default: "zenfig-")
 * @returns TempFile with path and cleanup function
 */
export function createTempFile(content: string, prefix = 'zenfig-'): Effect.Effect<TempFile, SystemError> {
  return pipe(
    Effect.sync(() => generateTempPath(prefix)),
    Effect.flatMap((filePath) =>
      pipe(
        Effect.try({
          try: () => {
            // Write file with restrictive permissions (0600 = owner read/write only)
            fs.writeFileSync(filePath, content, { mode: 0o600 });
          },
          catch: () => permissionDeniedError(filePath, 'write'),
        }),
        Effect.map(() => {
          // Create cleanup function
          const cleanup = (): Effect.Effect<void, never> =>
            Effect.sync(() => {
              try {
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                }
              } catch {
                // Ignore cleanup errors
              }
            });

          return { path: filePath, cleanup };
        })
      )
    )
  );
}

/**
 * Create a temp file containing JSON data
 *
 * @param data - Data to serialize to JSON
 * @param prefix - File name prefix
 * @returns TempFile with path and cleanup function
 */
export function createJsonTempFile(data: unknown, prefix = 'zenfig-'): Effect.Effect<TempFile, SystemError> {
  const content = JSON.stringify(data, null, 2);
  return createTempFile(content, prefix);
}

/**
 * Execute a function with a temp file, ensuring cleanup
 *
 * @param content - Content to write to temp file
 * @param fn - Function to execute with the temp file path
 */
export function withTempFile<A, E>(
  content: string,
  fn: (filePath: string) => Effect.Effect<A, E>
): Effect.Effect<A, E | SystemError> {
  return pipe(
    createTempFile(content),
    Effect.flatMap((tempFile) =>
      pipe(
        fn(tempFile.path),
        Effect.tap(() => tempFile.cleanup()),
        Effect.catchAll((error) =>
          pipe(
            tempFile.cleanup(),
            Effect.flatMap(() => Effect.fail(error))
          )
        )
      )
    )
  );
}

/**
 * Execute a function with a JSON temp file, ensuring cleanup
 *
 * @param data - Data to serialize to JSON
 * @param fn - Function to execute with the temp file path
 */
export function withJsonTempFile<A, E>(
  data: unknown,
  fn: (filePath: string) => Effect.Effect<A, E>
): Effect.Effect<A, E | SystemError> {
  const content = JSON.stringify(data, null, 2);
  return withTempFile(content, fn);
}
