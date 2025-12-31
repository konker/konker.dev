/**
 * Schema Path Resolver
 *
 * Adapter-agnostic key-path validation helpers
 */
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import { invalidKeyPathError, keyNotFoundError, type ValidationError } from '../errors.js';
import type { ResolvedPath, SchemaKeyInfo, ValidatorAdapter } from '../validation/types.js';

export type { ResolvedPath, SchemaKeyInfo } from '../validation/types.js';

// --------------------------------------------------------------------------
// Key Path Rules
// --------------------------------------------------------------------------

export const KEY_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/;

export function validateKeyPathSegments(keyPath: string): Effect.Effect<ReadonlyArray<string>, ValidationError> {
  return Effect.suspend(() => {
    if (!keyPath || keyPath.trim() === '') {
      return Effect.fail(keyNotFoundError('(empty path)'));
    }

    const segments = keyPath.split('.');
    const invalid = segments.find((segment) => !KEY_SEGMENT_PATTERN.test(segment));
    if (invalid) {
      return Effect.fail(invalidKeyPathError(keyPath, `Invalid key segment '${invalid}'`));
    }

    return Effect.succeed(segments);
  });
}

// --------------------------------------------------------------------------
// Adapter-backed Helpers
// --------------------------------------------------------------------------

export function resolvePath(
  schema: unknown,
  keyPath: string,
  adapter: ValidatorAdapter
): Effect.Effect<ResolvedPath, ValidationError> {
  return pipe(
    validateKeyPathSegments(keyPath),
    Effect.flatMap(() => adapter.resolvePath(schema, keyPath))
  );
}

export function canonicalizePath(
  schema: unknown,
  keyPath: string,
  adapter: ValidatorAdapter
): Effect.Effect<string, ValidationError> {
  return pipe(
    resolvePath(schema, keyPath, adapter),
    Effect.map((result) => result.canonicalPath)
  );
}

export function getAllLeafPaths(schema: unknown, adapter: ValidatorAdapter): ReadonlyArray<SchemaKeyInfo> {
  return adapter.getAllLeafPaths(schema);
}

export function getTypeDescription(schemaNode: unknown, adapter: ValidatorAdapter): string {
  return adapter.describeNode(schemaNode);
}
