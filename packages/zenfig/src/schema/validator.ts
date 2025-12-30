/**
 * Schema Validator
 *
 * Adapter-backed validation helpers
 */
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';

import type { ValidationError } from '../errors.js';
import type { ValidatorAdapter } from '../validation/types.js';
import { resolvePath } from './resolver.js';

export function validate<T>(
  value: unknown,
  schema: unknown,
  adapter: ValidatorAdapter
): Effect.Effect<T, ValidationError> {
  return adapter.validate<T>(value, schema);
}

export function validateAtPath(
  value: unknown,
  schema: unknown,
  path: string,
  adapter: ValidatorAdapter
): Effect.Effect<unknown, ValidationError> {
  return pipe(
    resolvePath(schema, path, adapter),
    Effect.flatMap((resolved) => adapter.validate<unknown>(value, resolved.schema))
  );
}

export function validateAll(
  value: unknown,
  schema: unknown,
  adapter: ValidatorAdapter
): Effect.Effect<{ readonly value: unknown; readonly errors: ReadonlyArray<ValidationError> }, never> {
  return adapter.validateAll(value, schema);
}

export function clearValidatorCache(): void {
  return;
}
