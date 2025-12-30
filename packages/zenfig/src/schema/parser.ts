/**
 * Schema-Directed Value Parser
 *
 * Adapter-backed parsing of provider values
 */
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { type ValidationError } from '../errors.js';
import type { ParsedValue, ParseMode, ValidatorAdapter } from '../validation/types.js';
import { validateKeyPathSegments } from './resolver.js';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type { ParseMode, ParsedValue } from '../validation/types.js';

export type ProviderParseResult = {
  readonly parsed: Record<string, unknown>;
  readonly unknownKeys: ReadonlyArray<string>;
};

// --------------------------------------------------------------------------
// Parsing Functions
// --------------------------------------------------------------------------

export function parseValue(
  value: string,
  schema: unknown,
  path: string,
  mode: ParseMode = 'auto',
  adapter: ValidatorAdapter
): Effect.Effect<ParsedValue, ValidationError> {
  return adapter.parseValue(value, schema, path, mode);
}

export function serializeValue(value: unknown, schema: unknown, adapter: ValidatorAdapter): string {
  return adapter.serializeValue(value, schema);
}

export function parseProviderKV(
  kv: Record<string, string>,
  schema: unknown,
  adapter: ValidatorAdapter
): Effect.Effect<ProviderParseResult, ValidationError> {
  return pipe(
    Effect.forEach(Object.entries(kv), ([path, value]) =>
      pipe(
        validateKeyPathSegments(path),
        Effect.map((segments) => ({ path, value, segments })),
        Effect.flatMap(({ path: keyPath, segments, value: rawValue }) =>
          pipe(
            adapter.resolvePath(schema, keyPath),
            Effect.flatMap((resolved) =>
              pipe(
                adapter.parseValue(rawValue, resolved.schema, keyPath, 'auto'),
                Effect.map((parsed) => ({
                  path: keyPath,
                  segments: resolved.segments,
                  parsed,
                  known: true as const,
                }))
              )
            ),
            Effect.catchAll(() =>
              Effect.succeed({
                path: keyPath,
                segments,
                parsed: rawValue,
                known: false as const,
              })
            )
          )
        )
      )
    ),
    Effect.map((results) => {
      const parsed: Record<string, unknown> = {};
      const unknownKeys: Array<string> = [];

      for (const { known, parsed: value, path, segments } of results) {
        if (!known) {
          unknownKeys.push(path);
        }

        let current: Record<string, unknown> = parsed;

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i]!;
          const isLast = i === segments.length - 1;

          if (isLast) {
            current[segment] = value;
          } else {
            if (!(segment in current) || typeof current[segment] !== 'object') {
              current[segment] = {};
            }
            current = current[segment] as Record<string, unknown>;
          }
        }
      }

      return { parsed, unknownKeys };
    })
  );
}
