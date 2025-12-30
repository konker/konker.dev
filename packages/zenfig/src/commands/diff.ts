/**
 * Diff Command
 *
 * Workflow: Fetch -> Render -> Compare -> Report
 */
import chalk from 'chalk';
import Table from 'cli-table3';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { type ResolvedConfig } from '../config.js';
import {
  type JsonnetError,
  type ProviderError,
  type SystemError,
  unknownKeysError,
  type ValidationError,
  type ZenfigError,
} from '../errors.js';
import { evaluateTemplate } from '../jsonnet/executor.js';
import { flatten } from '../lib/flatten.js';
import { mergeConfigs } from '../lib/merge.js';
import { createRedactOptions, NOT_SET, REDACTED, redactValue, REMOVED } from '../lib/redact.js';
import { checkProviderGuards } from '../providers/guards.js';
import { type ProviderContext } from '../providers/Provider.js';
import { getProvider } from '../providers/registry.js';
import { loadSchemaWithDefaults } from '../schema/loader.js';
import { parseProviderKV } from '../schema/parser.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type DiffOptions = {
  readonly service: string;
  readonly sources?: ReadonlyArray<string> | undefined;
  readonly config: ResolvedConfig;
  readonly format?: 'json' | 'table' | undefined;
  readonly showValues?: boolean | undefined;
  readonly unsafeShowValues?: boolean | undefined;
  readonly _testEntries?: ReadonlyArray<DiffEntry> | undefined;
};

export type DiffEntry = {
  readonly key: string;
  readonly stored: unknown;
  readonly rendered: unknown;
  readonly status: 'added' | 'removed' | 'modified' | 'unchanged';
};

export type DiffResult = {
  readonly entries: ReadonlyArray<DiffEntry>;
  readonly hasChanges: boolean;
  readonly warnings: ReadonlyArray<string>;
};

// --------------------------------------------------------------------------
// Diff Command
// --------------------------------------------------------------------------

/**
 * Execute the diff workflow
 */
export function executeDiff(
  options: DiffOptions
): Effect.Effect<DiffResult, ProviderError | ValidationError | JsonnetError | SystemError | ZenfigError | Error> {
  if (options._testEntries) {
    const hasChanges = options._testEntries.some((entry) => entry.status !== 'unchanged');
    return Effect.succeed({ entries: options._testEntries, hasChanges, warnings: [] });
  }

  return pipe(
    // 1. Load schema
    loadSchemaWithDefaults(options.config.schema, options.config.schemaExportName),
    Effect.flatMap(({ schema }) =>
      // 2. Get provider
      pipe(
        getProvider(options.config.provider),
        Effect.map((provider) => ({ schema, provider }))
      )
    ),
    Effect.flatMap(({ provider, schema }) => {
      const { config, service, sources = [] } = options;
      const allServices = [service, ...sources];

      // 3. Fetch stored values (flattened for comparison)
      return pipe(
        Effect.forEach(allServices, (svc) => {
          const ctx: ProviderContext = { prefix: config.ssmPrefix, service: svc, env: config.env };
          return pipe(
            checkProviderGuards(provider, ctx, config.providerGuards),
            Effect.flatMap(() => provider.fetch(ctx)),
            Effect.flatMap((kv) => parseProviderKV(kv, schema)),
            Effect.map((result) => ({
              service: svc,
              parsed: result.parsed,
              unknownKeys: result.unknownKeys,
            }))
          );
        }),
        Effect.flatMap((storedByService) => {
          const unknownKeys = storedByService
            .filter((entry) => entry.unknownKeys.length > 0)
            .map((entry) => ({ service: entry.service, keys: entry.unknownKeys }));

          if (unknownKeys.length > 0 && config.strict) {
            const flattened = unknownKeys.flatMap((entry) => entry.keys.map((key) => `${entry.service}:${key}`));
            return Effect.fail(unknownKeysError(flattened));
          }

          const warnings =
            unknownKeys.length > 0
              ? unknownKeys.map((entry) => `Unknown keys for service '${entry.service}': ${entry.keys.join(', ')}`)
              : [];

          return pipe(
            mergeConfigs(
              storedByService.map((entry) => [entry.service, entry.parsed] as const),
              {}
            ),
            Effect.map((mergedStored) => ({
              mergedStored,
              config,
              warnings,
            }))
          );
        })
      );
    }),
    Effect.flatMap(({ config, mergedStored, warnings }) => {
      const flatStored = flatten(mergedStored.merged);

      // 4. Render config through Jsonnet
      return pipe(
        evaluateTemplate(mergedStored.merged, config.env, config.jsonnet, config.jsonnetTimeoutMs),
        Effect.map((rendered) => ({
          flatStored,
          flatRendered: flatten(rendered),
          warnings,
        }))
      );
    }),
    Effect.map(({ flatRendered, flatStored, warnings }) => {
      // 5. Compare
      const allKeys = new Set([...Object.keys(flatStored), ...Object.keys(flatRendered)]);
      const entries: Array<DiffEntry> = [];

      for (const key of Array.from(allKeys).sort()) {
        const stored = flatStored[key];
        const renderedVal = flatRendered[key];

        if (stored === undefined && renderedVal !== undefined) {
          entries.push({ key, stored: undefined, rendered: renderedVal, status: 'added' });
        } else if (stored !== undefined && renderedVal === undefined) {
          entries.push({ key, stored, rendered: undefined, status: 'removed' });
        } else if (JSON.stringify(stored) !== JSON.stringify(renderedVal)) {
          entries.push({ key, stored, rendered: renderedVal, status: 'modified' });
        } else {
          entries.push({ key, stored, rendered: renderedVal, status: 'unchanged' });
        }
      }

      const hasChanges = entries.some((e) => e.status !== 'unchanged');

      return { entries, hasChanges, warnings };
    })
  );
}

/**
 * Format diff result as table
 */
function formatDiffTable(entries: ReadonlyArray<DiffEntry>, showValues: boolean): string {
  const changedEntries = entries.filter((e) => e.status !== 'unchanged');

  if (changedEntries.length === 0) {
    return 'No differences found.';
  }

  const table = new Table({
    head: ['Key', 'Stored (Provider)', 'Rendered (Jsonnet)', 'Status'],
    style: { head: ['cyan'] },
  });

  const redactOpts = createRedactOptions(showValues, false);

  for (const entry of changedEntries) {
    const storedStr = entry.stored === undefined ? NOT_SET : redactValue(entry.stored, redactOpts);
    const renderedStr = entry.rendered === undefined ? REMOVED : redactValue(entry.rendered, redactOpts);

    let statusStr: string;
    switch (entry.status) {
      case 'added':
        statusStr = chalk.green('Added');
        break;
      case 'removed':
        statusStr = chalk.red('Removed');
        break;
      case 'modified':
        statusStr = chalk.yellow('Modified');
        break;
      default:
        statusStr = entry.status;
    }

    table.push([entry.key, storedStr, renderedStr, statusStr]);
  }

  return table.toString();
}

/**
 * Format diff result as JSON
 */
function formatDiffJson(entries: ReadonlyArray<DiffEntry>, showValues: boolean): string {
  const changedEntries = entries.filter((e) => e.status !== 'unchanged');

  const output = changedEntries.map((entry) => ({
    key: entry.key,
    stored: entry.stored === undefined ? null : showValues ? entry.stored : REDACTED,
    rendered: entry.rendered === undefined ? null : showValues ? entry.rendered : REDACTED,
    status: entry.status,
  }));

  return JSON.stringify(output, null, 2);
}

/**
 * Run diff and print results
 */
export function runDiff(
  options: DiffOptions
): Effect.Effect<boolean, ProviderError | ValidationError | JsonnetError | SystemError | ZenfigError | Error> {
  return pipe(
    executeDiff(options),
    Effect.map((result) => {
      for (const warning of result.warnings) {
        console.error(`[zenfig] Warning: ${warning}`);
      }

      const showValues = options.unsafeShowValues === true ? true : options.showValues && process.stdout.isTTY;
      const format = options.format ?? 'table';

      if (format === 'json') {
        console.log(formatDiffJson(result.entries, showValues ?? false));
      } else {
        console.log(formatDiffTable(result.entries, showValues ?? false));
      }

      // Return true if there are differences (for exit code)
      return result.hasChanges;
    })
  );
}
