/**
 * Snapshot Commands (save/restore)
 *
 * Save: Fetch -> Validate -> Store
 * Restore: Load -> Validate -> Diff -> Confirm -> Push
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { type ResolvedConfig } from '../config.js';
import {
  fileNotFoundError,
  permissionDeniedError,
  type ProviderError,
  snapshotSchemaMismatchError,
  type SystemError,
  type ValidationError,
  type ZenfigError,
} from '../errors.js';
import { type ProviderContext, type ProviderKV } from '../providers/Provider.js';
import { getProvider } from '../providers/registry.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type SnapshotMeta = {
  readonly timestamp: string;
  readonly env: string;
  readonly provider: string;
  readonly ssmPrefix: string;
  readonly schemaHash: string;
  readonly services: ReadonlyArray<string>;
};

export type SnapshotV1 = {
  readonly version: 1;
  readonly layer: 'stored';
  readonly meta: SnapshotMeta;
  readonly data: Record<string, ProviderKV>; // service -> kv map
};

export type SnapshotSaveOptions = {
  readonly service: string;
  readonly sources?: ReadonlyArray<string> | undefined;
  readonly output?: string | undefined;
  readonly encrypt?: boolean | undefined;
  readonly snapshotKeyFile?: string | undefined;
  readonly config: ResolvedConfig;
};

export type SnapshotRestoreOptions = {
  readonly snapshotFile: string;
  readonly dryRun?: boolean | undefined;
  readonly forceSchemaMatch?: boolean | undefined;
  readonly confirm?: boolean | undefined;
  readonly showValues?: boolean | undefined;
  readonly unsafeShowValues?: boolean | undefined;
  readonly config: ResolvedConfig;
};

export type SnapshotSaveResult = {
  readonly path: string;
  readonly services: ReadonlyArray<string>;
  readonly keyCount: number;
};

export type SnapshotRestoreResult = {
  readonly applied: boolean;
  readonly changes: ReadonlyArray<{ key: string; service: string; action: 'add' | 'update' }>;
};

// --------------------------------------------------------------------------
// Helper Functions
// --------------------------------------------------------------------------

const ensureDirectoryExists = (filePath: string): Effect.Effect<void, SystemError> =>
  Effect.try({
    try: () => {
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    },
    catch: () => permissionDeniedError(filePath, 'create directory'),
  });

const checkGitIgnore = (dir: string): Effect.Effect<boolean, never> =>
  Effect.sync(() => {
    // Check if directory is in a git repo and if .gitignore covers it
    try {
      // Simple check: look for .gitignore in parent directories
      let current = dir;
      const root = path.parse(current).root;

      while (current !== root) {
        const gitignorePath = path.join(current, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
          const content = fs.readFileSync(gitignorePath, 'utf-8');
          if (content.includes('.zenfig/snapshots') || content.includes('.zenfig')) {
            return true;
          }
        }
        current = path.dirname(current);
      }

      return false;
    } catch {
      return false;
    }
  });

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
// Snapshot Save
// --------------------------------------------------------------------------

/**
 * Save a snapshot of stored values
 */
export const executeSnapshotSave = (
  options: SnapshotSaveOptions
): Effect.Effect<SnapshotSaveResult, ProviderError | SystemError | ValidationError | ZenfigError> =>
  pipe(
    // 1. Load schema for hash
    loadSchemaWithDefaults(options.config.schema, options.config.schemaExportName),
    Effect.flatMap(({ schemaHash }) =>
      // 2. Get provider
      pipe(
        getProvider(options.config.provider),
        Effect.map((provider) => ({ schemaHash, provider }))
      )
    ),
    Effect.flatMap(({ provider, schemaHash }) => {
      const { config, service, sources = [] } = options;
      const allServices = [service, ...sources];

      // 3. Fetch stored values per service
      return pipe(
        Effect.forEach(allServices, (svc) => {
          const ctx: ProviderContext = { prefix: config.ssmPrefix, service: svc, env: config.env };
          return pipe(
            provider.fetch(ctx),
            Effect.map((kv) => ({ svc, kv }))
          );
        }),
        Effect.map((results) => {
          const data: Record<string, ProviderKV> = {};
          let totalKeys = 0;

          for (const { kv, svc } of results) {
            data[svc] = kv;
            totalKeys += Object.keys(kv).length;
          }

          return { schemaHash, allServices, data, totalKeys, config };
        })
      );
    }),
    Effect.flatMap(({ allServices, config, data, schemaHash, totalKeys }) => {
      // 4. Build snapshot
      const snapshot: SnapshotV1 = {
        version: 1,
        layer: 'stored',
        meta: {
          timestamp: new Date().toISOString(),
          env: config.env,
          provider: config.provider,
          ssmPrefix: config.ssmPrefix,
          schemaHash,
          services: allServices,
        },
        data,
      };

      // 5. Determine output path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultPath = path.join('.zenfig', 'snapshots', `${options.service}-${config.env}-${timestamp}.json`);
      const outputPath = options.output ?? defaultPath;

      // 6. Ensure directory exists
      return pipe(
        ensureDirectoryExists(outputPath),
        Effect.flatMap(() => checkGitIgnore(path.dirname(outputPath))),
        Effect.flatMap((isIgnored) => {
          if (!isIgnored) {
            console.warn(
              '[zenfig] Warning: Snapshot directory may not be covered by .gitignore. ' +
                'Add ".zenfig/snapshots" to .gitignore to avoid committing secrets.'
            );
          }

          // 7. Write snapshot with restrictive permissions
          const content = JSON.stringify(snapshot, null, 2);

          return pipe(
            Effect.try({
              try: () => fs.writeFileSync(outputPath, content, { mode: 0o600 }),
              catch: () => permissionDeniedError(outputPath, 'write'),
            }),
            Effect.map(() => {
              console.log(`Snapshot saved to ${outputPath}`);

              return {
                path: outputPath,
                services: allServices,
                keyCount: totalKeys,
              };
            })
          );
        })
      );
    })
  );

// --------------------------------------------------------------------------
// Snapshot Restore
// --------------------------------------------------------------------------

/**
 * Restore a snapshot
 */
export const executeSnapshotRestore = (
  options: SnapshotRestoreOptions
): Effect.Effect<SnapshotRestoreResult, ProviderError | SystemError | ValidationError | ZenfigError> =>
  pipe(
    // 1. Load snapshot file
    Effect.sync(() => {
      if (!fs.existsSync(options.snapshotFile)) {
        return { exists: false as const, content: '' };
      }
      return { exists: true as const, content: '' };
    }),
    Effect.flatMap(({ exists }) => {
      if (!exists) {
        return Effect.fail(fileNotFoundError(options.snapshotFile));
      }

      return Effect.try({
        try: () => fs.readFileSync(options.snapshotFile, 'utf-8'),
        catch: () => fileNotFoundError(options.snapshotFile),
      });
    }),
    Effect.flatMap((content) =>
      Effect.try({
        try: () => JSON.parse(content) as SnapshotV1,
        catch: () => fileNotFoundError(`Invalid JSON in ${options.snapshotFile}`),
      })
    ),
    Effect.flatMap((snapshot) => {
      // 2. Validate snapshot version
      if (snapshot.version !== 1) {
        return Effect.fail(fileNotFoundError(`Unsupported snapshot version: ${snapshot.version}`));
      }

      // 3. Check schema hash
      return pipe(
        loadSchemaWithDefaults(options.config.schema, options.config.schemaExportName),
        Effect.flatMap(({ schemaHash }) => {
          const { forceSchemaMatch = false } = options;

          if (snapshot.meta.schemaHash !== schemaHash && !forceSchemaMatch) {
            return Effect.fail(snapshotSchemaMismatchError(snapshot.meta.schemaHash, schemaHash));
          }

          if (snapshot.meta.schemaHash !== schemaHash) {
            console.warn(
              '[zenfig] Warning: Schema has changed since snapshot was created. Proceeding with --force-schema-mismatch.'
            );
          }

          return Effect.succeed({ snapshot, schemaHash });
        })
      );
    }),
    Effect.flatMap(({ snapshot }) =>
      // 4. Get provider
      pipe(
        getProvider(options.config.provider),
        Effect.map((provider) => ({ snapshot, provider }))
      )
    ),
    Effect.flatMap(({ provider, snapshot }) => {
      const { config, confirm = false, dryRun = false } = options;

      // 5. Calculate changes
      return pipe(
        Effect.forEach(Object.entries(snapshot.data), ([svc, kv]) => {
          const ctx: ProviderContext = { prefix: config.ssmPrefix, service: svc, env: config.env };
          return pipe(
            provider.fetch(ctx),
            Effect.map((currentKv) => ({ svc, kv, currentKv }))
          );
        }),
        Effect.map((results) => {
          const changes: Array<{ key: string; service: string; action: 'add' | 'update' }> = [];

          for (const { currentKv, kv, svc } of results) {
            for (const [key, value] of Object.entries(kv)) {
              if (!(key in currentKv)) {
                changes.push({ key, service: svc, action: 'add' });
              } else if (currentKv[key] !== value) {
                changes.push({ key, service: svc, action: 'update' });
              }
            }
          }

          return { snapshot, provider, changes, config, dryRun, confirm };
        })
      );
    }),
    Effect.flatMap(
      ({
        changes,
        config,
        confirm,
        dryRun,
        provider,
        snapshot,
      }): Effect.Effect<SnapshotRestoreResult, ProviderError> => {
        // 6. Show diff
        console.log(`\nChanges to apply (${changes.length} keys):`);
        for (const change of changes) {
          const action = change.action === 'add' ? '[ADD]' : '[UPDATE]';
          console.log(`  ${action} ${change.service}/${change.key}`);
        }

        if (changes.length === 0) {
          console.log('No changes to apply.');
          return Effect.succeed({ applied: false, changes: [] });
        }

        if (dryRun) {
          console.log('\nDry run - no changes applied.');
          return Effect.succeed({ applied: false, changes });
        }

        // 7. Confirm
        if (!confirm && !config.ci) {
          return pipe(
            promptConfirmation('\nApply these changes?'),
            Effect.flatMap((confirmed): Effect.Effect<SnapshotRestoreResult, ProviderError> => {
              if (!confirmed) {
                console.log('Restore cancelled.');
                return Effect.succeed({ applied: false, changes });
              }

              // 8. Apply changes
              return pipe(
                Effect.forEach(Object.entries(snapshot.data), ([svc, kv]) => {
                  const ctx: ProviderContext = { prefix: config.ssmPrefix, service: svc, env: config.env };
                  return Effect.forEach(Object.entries(kv), ([key, value]) => provider.upsert(ctx, key, value));
                }),
                Effect.map((): SnapshotRestoreResult => {
                  console.log(`\nRestored ${changes.length} keys from snapshot.`);
                  return { applied: true, changes };
                })
              );
            })
          );
        } else if (!confirm && config.ci) {
          console.error('Error: --confirm flag required in CI mode');
          return Effect.succeed({ applied: false, changes });
        }

        // 8. Apply changes (with confirm flag)
        return pipe(
          Effect.forEach(Object.entries(snapshot.data), ([svc, kv]) => {
            const ctx: ProviderContext = { prefix: config.ssmPrefix, service: svc, env: config.env };
            return Effect.forEach(Object.entries(kv), ([key, value]) => provider.upsert(ctx, key, value));
          }),
          Effect.map((): SnapshotRestoreResult => {
            console.log(`\nRestored ${changes.length} keys from snapshot.`);
            return { applied: true, changes };
          })
        );
      }
    )
  );

/**
 * Run snapshot save
 */
export const runSnapshotSave = (
  options: SnapshotSaveOptions
): Effect.Effect<void, ProviderError | SystemError | ValidationError | ZenfigError> =>
  pipe(
    executeSnapshotSave(options),
    Effect.map((result) => {
      console.log(`Saved ${result.keyCount} keys from ${result.services.length} service(s)`);
    })
  );

/**
 * Run snapshot restore
 */
export const runSnapshotRestore = (
  options: SnapshotRestoreOptions
): Effect.Effect<boolean, ProviderError | SystemError | ValidationError | ZenfigError> =>
  pipe(
    executeSnapshotRestore(options),
    Effect.map((result) => result.applied)
  );
