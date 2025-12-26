/**
 * Delete Command
 *
 * Workflow: Input -> Validate -> Confirm -> Remove -> Audit
 */
import * as Effect from 'effect/Effect';
import * as readline from 'node:readline';

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
  Effect.gen(function* () {
    const { service, key, confirm = false, config } = options;

    // 1. Load schema
    const { schema } = yield* loadSchemaWithDefaults(config.schema, config.schemaExportName);

    // 2. Resolve the key path (may not exist in schema - warn but allow)
    const resolveResult = yield* Effect.either(resolvePath(schema, key));
    let canonicalKey: string;

    if (resolveResult._tag === 'Left') {
      // Key not in schema - warn but use the input as-is
      console.warn(`[zenfig] Warning: Key '${key}' not found in schema. Proceeding with deletion anyway.`);
      canonicalKey = key;
    } else {
      canonicalKey = resolveResult.right.canonicalPath;
    }

    // 3. Confirm deletion
    if (!confirm && !config.ci) {
      const confirmed = yield* promptConfirmation(
        `Delete key '${canonicalKey}' from ${config.ssmPrefix}/${service}/${config.env}?`
      );

      if (!confirmed) {
        console.log('Deletion cancelled.');
        return { canonicalKey, deleted: false };
      }
    } else if (!confirm && config.ci) {
      // CI mode requires explicit --confirm
      console.error('Error: --confirm flag required in CI mode');
      return { canonicalKey, deleted: false };
    }

    // 4. Get provider
    const provider = yield* getProvider(config.provider);

    // 5. Delete from provider
    const ctx: ProviderContext = {
      prefix: config.ssmPrefix,
      service,
      env: config.env,
    };

    yield* provider.delete(ctx, canonicalKey);

    // 6. Audit log
    const timestamp = new Date().toISOString();
    const user = process.env['USER'] ?? process.env['USERNAME'] ?? 'unknown';
    console.error(`[${timestamp}] Deleted: ${canonicalKey} by ${user}`);

    return { canonicalKey, deleted: true };
  });

/**
 * Run delete and print result
 */
export const runDelete = (
  options: DeleteOptions
): Effect.Effect<boolean, ProviderError | ValidationError | SystemError | ZenfigError> =>
  Effect.gen(function* () {
    const result = yield* executeDelete(options);

    if (result.deleted) {
      console.log(`Successfully deleted ${result.canonicalKey}`);
    }

    return result.deleted;
  });
