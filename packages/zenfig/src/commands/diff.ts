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
  type ValidationError,
  type ZenfigError,
} from '../errors.js';
import { evaluateTemplate } from '../jsonnet/executor.js';
import { flatten } from '../lib/flatten.js';
import { mergeConfigs } from '../lib/merge.js';
import { createRedactOptions, NOT_SET, REDACTED, redactValue, REMOVED } from '../lib/redact.js';
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
};

// --------------------------------------------------------------------------
// Diff Command
// --------------------------------------------------------------------------

/**
 * Execute the diff workflow
 */
export const executeDiff = (
  options: DiffOptions
): Effect.Effect<DiffResult, ProviderError | ValidationError | JsonnetError | SystemError | ZenfigError | Error> =>
  pipe(
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
            provider.fetch(ctx),
            Effect.flatMap((kv) => parseProviderKV(kv, schema)),
            Effect.map((parsed) => [svc, parsed] as const)
          );
        }),
        Effect.flatMap((storedByService) =>
          pipe(
            mergeConfigs(storedByService, {}),
            Effect.map((mergedStored) => ({
              mergedStored,
              config,
            }))
          )
        )
      );
    }),
    Effect.flatMap(({ config, mergedStored }) => {
      const flatStored = flatten(mergedStored.merged);

      // 4. Render config through Jsonnet
      return pipe(
        evaluateTemplate(mergedStored.merged, config.env, config.jsonnet, config.jsonnetTimeoutMs),
        Effect.map((rendered) => ({
          flatStored,
          flatRendered: flatten(rendered),
        }))
      );
    }),
    Effect.map(({ flatRendered, flatStored }) => {
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

      return { entries, hasChanges };
    })
  );

/**
 * Format diff result as table
 */
const formatDiffTable = (entries: ReadonlyArray<DiffEntry>, showValues: boolean): string => {
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
};

/**
 * Format diff result as JSON
 */
const formatDiffJson = (entries: ReadonlyArray<DiffEntry>, showValues: boolean): string => {
  const changedEntries = entries.filter((e) => e.status !== 'unchanged');

  const output = changedEntries.map((entry) => ({
    key: entry.key,
    stored: entry.stored === undefined ? null : showValues ? entry.stored : REDACTED,
    rendered: entry.rendered === undefined ? null : showValues ? entry.rendered : REDACTED,
    status: entry.status,
  }));

  return JSON.stringify(output, null, 2);
};

/**
 * Run diff and print results
 */
export const runDiff = (
  options: DiffOptions
): Effect.Effect<boolean, ProviderError | ValidationError | JsonnetError | SystemError | ZenfigError | Error> =>
  pipe(
    executeDiff(options),
    Effect.map((result) => {
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
