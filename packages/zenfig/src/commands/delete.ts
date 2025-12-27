/**
 * Delete Command
 *
 * Workflow: Input -> Validate -> Confirm -> Remove -> Audit
 */
import * as readline from 'node:readline';

import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { type ResolvedConfig } from '../config.js';
import { type ProviderError, type SystemError, type ValidationError, type ZenfigError } from '../errors.js';
import { type ProviderContext } from '../providers/Provider.js';
import { getProvider } from '../providers/registry.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { resolvePath } from '../schema/resolver.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type DeleteOptions = {
  readonly service: string;
  readonly key: string;
  readonly confirm?: boolean | undefined; // Skip confirmation
  readonly config: ResolvedConfig;
};

export type DeleteResult = {
  readonly canonicalKey: string;
  readonly deleted: boolean;
};

// --------------------------------------------------------------------------
// Helper Functions
// --------------------------------------------------------------------------

/**
 * Prompt for confirmation
 */
const promptConfirmation = (message: string): Effect.Effect<boolean, never> =>
  Effect.promise(async () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise<boolean>((resolve) => {
      rl.question(`${message} [y/N] `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  });

// --------------------------------------------------------------------------
// Delete Command
// --------------------------------------------------------------------------

/**
 * Execute the delete workflow
 */
export const executeDelete = (
  options: DeleteOptions
): Effect.Effect<DeleteResult, ProviderError | ValidationError | SystemError | ZenfigError> =>
  pipe(
    // 1. Load schema
    loadSchemaWithDefaults(options.config.schema, options.config.schemaExportName),
    Effect.flatMap(({ schema }) =>
      // 2. Resolve the key path (may not exist in schema - warn but allow)
      pipe(
        Effect.either(resolvePath(schema, options.key)),
        Effect.map((resolveResult) => {
          if (resolveResult._tag === 'Left') {
            // Key not in schema - warn but use the input as-is
            console.warn(
              `[zenfig] Warning: Key '${options.key}' not found in schema. Proceeding with deletion anyway.`
            );
            return options.key;
          }
          return resolveResult.right.canonicalPath;
        })
      )
    ),
    Effect.flatMap((canonicalKey) => {
      const { config, confirm = false, service } = options;

      // 3. Confirm deletion
      if (!confirm && !config.ci) {
        return pipe(
          promptConfirmation(`Delete key '${canonicalKey}' from ${config.ssmPrefix}/${service}/${config.env}?`),
          Effect.flatMap(
            (confirmed): Effect.Effect<{ canonicalKey: string; deleted: boolean; shouldDelete: boolean }, never> => {
              if (!confirmed) {
                console.log('Deletion cancelled.');
                return Effect.succeed({ canonicalKey, deleted: false, shouldDelete: false });
              }
              return Effect.succeed({ canonicalKey, deleted: false, shouldDelete: true });
            }
          )
        );
      } else if (!confirm && config.ci) {
        // CI mode requires explicit --confirm
        console.error('Error: --confirm flag required in CI mode');
        return Effect.succeed({ canonicalKey, deleted: false, shouldDelete: false });
      }

      return Effect.succeed({ canonicalKey, deleted: false, shouldDelete: true });
    }),
    Effect.flatMap(({ canonicalKey, shouldDelete }): Effect.Effect<DeleteResult, ProviderError> => {
      if (!shouldDelete) {
        return Effect.succeed({ canonicalKey, deleted: false });
      }

      const { config, service } = options;
      const ctx: ProviderContext = {
        prefix: config.ssmPrefix,
        service,
        env: config.env,
      };

      // 4. Get provider and delete
      return pipe(
        getProvider(config.provider),
        Effect.flatMap((provider) => provider.delete(ctx, canonicalKey)),
        Effect.map(() => {
          // 5. Audit log
          const timestamp = new Date().toISOString();
          const user = process.env.USER ?? process.env.USERNAME ?? 'unknown';
          console.error(`[${timestamp}] Deleted: ${canonicalKey} by ${user}`);

          return { canonicalKey, deleted: true };
        })
      );
    })
  );

/**
 * Run delete and print result
 */
export const runDelete = (
  options: DeleteOptions
): Effect.Effect<boolean, ProviderError | ValidationError | SystemError | ZenfigError> =>
  pipe(
    executeDelete(options),
    Effect.map((result) => {
      if (result.deleted) {
        console.log(`Successfully deleted ${result.canonicalKey}`);
      }
      return result.deleted;
    })
  );
