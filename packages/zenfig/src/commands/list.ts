/**
 * List Command
 *
 * Workflow: Fetch -> Format -> Output
 */
import Table from 'cli-table3';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { type ResolvedConfig } from '../config.js';
import { type ProviderError } from '../errors.js';
import { type RedactOptions, redactValue } from '../lib/redact.js';
import { checkProviderGuards } from '../providers/guards.js';
import { type ProviderContext, type ProviderKV } from '../providers/Provider.js';
import { getProvider } from '../providers/registry.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ListFormat = 'keys' | 'table' | 'json';

export type ListOptions = {
  readonly service: string;
  readonly format?: ListFormat | undefined;
  readonly showValues?: boolean | undefined;
  readonly unsafeShowValues?: boolean | undefined;
  readonly config: ResolvedConfig;
};

export type ListResult = {
  readonly keys: ReadonlyArray<string>;
  readonly values: ProviderKV;
};

// --------------------------------------------------------------------------
// Formatting Functions
// --------------------------------------------------------------------------

/**
 * Format list result as simple key list (one per line)
 */
export const formatListKeys = (keys: ReadonlyArray<string>): string => {
  if (keys.length === 0) {
    return 'No keys found.';
  }
  return keys.join('\n');
};

/**
 * Format list result as table
 */
export const formatListTable = (kv: ProviderKV, keys: ReadonlyArray<string>, showValues: boolean): string => {
  if (keys.length === 0) {
    return 'No keys found.';
  }

  const table = new Table({
    head: ['Key', 'Stored (Provider)'],
    style: { head: ['cyan'] },
  });

  const redactOpts: RedactOptions = { showValues };

  for (const key of keys) {
    const value = kv[key];
    const valueStr = redactValue(value, redactOpts);
    table.push([key, valueStr]);
  }

  return table.toString();
};

/**
 * Format list result as JSON
 */
export const formatListJson = (kv: ProviderKV, keys: ReadonlyArray<string>, showValues: boolean): string => {
  if (keys.length === 0) {
    return '{}';
  }

  const redactOpts: RedactOptions = { showValues };
  const output: Record<string, string> = {};

  for (const key of keys) {
    const value = kv[key];
    output[key] = redactValue(value, redactOpts);
  }

  return JSON.stringify(output, null, 2);
};

// --------------------------------------------------------------------------
// List Command
// --------------------------------------------------------------------------

/**
 * Execute the list workflow
 */
export const executeList = (options: ListOptions): Effect.Effect<ListResult, ProviderError> =>
  pipe(
    // 1. Get provider
    getProvider(options.config.provider),
    Effect.flatMap((provider) => {
      const { config, service } = options;

      // 2. Build context
      const ctx: ProviderContext = {
        prefix: config.ssmPrefix,
        service,
        env: config.env,
      };

      // 3. Fetch stored values
      return pipe(
        checkProviderGuards(provider, ctx, config.providerGuards),
        Effect.flatMap(() => provider.fetch(ctx)),
        Effect.map((kv) => {
          // 4. Sort keys alphabetically (case-insensitive)
          const keys = Object.keys(kv).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

          return { keys, values: kv };
        })
      );
    })
  );

/**
 * Run list and print results
 */
export const runList = (options: ListOptions): Effect.Effect<void, ProviderError> =>
  pipe(
    executeList(options),
    Effect.map((result) => {
      const showValues = options.unsafeShowValues === true ? true : options.showValues && process.stdout.isTTY;
      const format = options.format ?? 'keys';

      switch (format) {
        case 'json':
          console.log(formatListJson(result.values, result.keys, showValues ?? false));
          break;
        case 'table':
          console.log(formatListTable(result.values, result.keys, showValues ?? false));
          break;
        case 'keys':
        default:
          console.log(formatListKeys(result.keys));
          break;
      }
    })
  );
