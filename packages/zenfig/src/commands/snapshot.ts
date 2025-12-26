/**
 * Snapshot Commands (save/restore)
 *
 * Save: Fetch -> Validate -> Store
 * Restore: Load -> Validate -> Diff -> Confirm -> Push
 */
import * as Effect from 'effect/Effect';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

import { type ResolvedConfig } from '../config.js';
import {
  fileNotFoundError,
  permissionDeniedError,
  snapshotSchemaMismatchError,
  type ProviderError,
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
  Effect.gen(function* () {
    const { service, sources = [], config } = options;
    const allServices = [service, ...sources];

    // 1. Load schema for hash
    const { schemaHash } = yield* loadSchemaWithDefaults(config.schema, config.schemaExportName);

    // 2. Get provider
    const provider = yield* getProvider(config.provider);

    // 3. Fetch stored values per service
    const data: Record<string, ProviderKV> = {};
    let totalKeys = 0;

    for (const svc of allServices) {
      const ctx: ProviderContext = { prefix: config.ssmPrefix, service: svc, env: config.env };
      const kv = yield* provider.fetch(ctx);
      data[svc] = kv;
      totalKeys += Object.keys(kv).length;
    }

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
    const defaultPath = path.join('.zenfig', 'snapshots', `${service}-${config.env}-${timestamp}.json`);
    const outputPath = options.output ?? defaultPath;

    // 6. Ensure directory exists
    yield* ensureDirectoryExists(outputPath);

    // 7. Check gitignore
    const isIgnored = yield* checkGitIgnore(path.dirname(outputPath));
    if (!isIgnored) {
      console.warn(
        '[zenfig] Warning: Snapshot directory may not be covered by .gitignore. ' +
          'Add ".zenfig/snapshots" to .gitignore to avoid committing secrets.'
      );
    }

    // 8. Write snapshot with restrictive permissions
    const content = JSON.stringify(snapshot, null, 2);

    yield* Effect.try({
      try: () => fs.writeFileSync(outputPath, content, { mode: 0o600 }),
      catch: () => permissionDeniedError(outputPath, 'write'),
    });

    console.log(`Snapshot saved to ${outputPath}`);

    return {
      path: outputPath,
      services: allServices,
      keyCount: totalKeys,
    };
  });

// --------------------------------------------------------------------------
// Snapshot Restore
// --------------------------------------------------------------------------

/**
 * Restore a snapshot
 */
export const executeSnapshotRestore = (
  options: SnapshotRestoreOptions
): Effect.Effect<SnapshotRestoreResult, ProviderError | SystemError | ValidationError | ZenfigError> =>
  Effect.gen(function* () {
    const { snapshotFile, dryRun = false, forceSchemaMatch = false, confirm = false, config } = options;

    // 1. Load snapshot file
    if (!fs.existsSync(snapshotFile)) {
      return yield* Effect.fail(fileNotFoundError(snapshotFile));
    }

    const content = yield* Effect.try({
      try: () => fs.readFileSync(snapshotFile, 'utf-8'),
      catch: () => fileNotFoundError(snapshotFile),
    });

    const snapshot = yield* Effect.try({
      try: () => JSON.parse(content) as SnapshotV1,
      catch: () => fileNotFoundError(`Invalid JSON in ${snapshotFile}`),
    });

    // 2. Validate snapshot version
    if (snapshot.version !== 1) {
      return yield* Effect.fail(fileNotFoundError(`Unsupported snapshot version: ${snapshot.version}`));
    }

    // 3. Check schema hash
    const { schemaHash } = yield* loadSchemaWithDefaults(config.schema, config.schemaExportName);

    if (snapshot.meta.schemaHash !== schemaHash && !forceSchemaMatch) {
      return yield* Effect.fail(snapshotSchemaMismatchError(snapshot.meta.schemaHash, schemaHash));
    }

    if (snapshot.meta.schemaHash !== schemaHash) {
      console.warn('[zenfig] Warning: Schema has changed since snapshot was created. Proceeding with --force-schema-mismatch.');
    }

    // 4. Get provider
    const provider = yield* getProvider(config.provider);

    // 5. Calculate changes
    const changes: Array<{ key: string; service: string; action: 'add' | 'update' }> = [];

    for (const [svc, kv] of Object.entries(snapshot.data)) {
      const ctx: ProviderContext = { prefix: config.ssmPrefix, service: svc, env: config.env };
      const currentKv = yield* provider.fetch(ctx);

      for (const [key, value] of Object.entries(kv)) {
        if (!(key in currentKv)) {
          changes.push({ key, service: svc, action: 'add' });
        } else if (currentKv[key] !== value) {
          changes.push({ key, service: svc, action: 'update' });
        }
      }
    }

    // 6. Show diff
    console.log(`\nChanges to apply (${changes.length} keys):`);
    for (const change of changes) {
      const action = change.action === 'add' ? '[ADD]' : '[UPDATE]';
      console.log(`  ${action} ${change.service}/${change.key}`);
    }

    if (changes.length === 0) {
      console.log('No changes to apply.');
      return { applied: false, changes: [] };
    }

    if (dryRun) {
      console.log('\nDry run - no changes applied.');
      return { applied: false, changes };
    }

    // 7. Confirm
    if (!confirm && !config.ci) {
      const confirmed = yield* promptConfirmation('\nApply these changes?');
      if (!confirmed) {
        console.log('Restore cancelled.');
        return { applied: false, changes };
      }
    } else if (!confirm && config.ci) {
      console.error('Error: --confirm flag required in CI mode');
      return { applied: false, changes };
    }

    // 8. Apply changes
    for (const [svc, kv] of Object.entries(snapshot.data)) {
      const ctx: ProviderContext = { prefix: config.ssmPrefix, service: svc, env: config.env };

      for (const [key, value] of Object.entries(kv)) {
        yield* provider.upsert(ctx, key, value);
      }
    }

    console.log(`\nRestored ${changes.length} keys from snapshot.`);

    return { applied: true, changes };
  });

/**
 * Run snapshot save
 */
export const runSnapshotSave = (
  options: SnapshotSaveOptions
): Effect.Effect<void, ProviderError | SystemError | ValidationError | ZenfigError> =>
  Effect.gen(function* () {
    const result = yield* executeSnapshotSave(options);
    console.log(`Saved ${result.keyCount} keys from ${result.services.length} service(s)`);
  });

/**
 * Run snapshot restore
 */
export const runSnapshotRestore = (
  options: SnapshotRestoreOptions
): Effect.Effect<boolean, ProviderError | SystemError | ValidationError | ZenfigError> =>
  Effect.gen(function* () {
    const result = yield* executeSnapshotRestore(options);
    return result.applied;
  });
