/**
 * Shared Standard Schema error and conversion helpers.
 *
 * @module
 */

import type { StandardSchemaV1 } from '@standard-schema/spec';
import { err, ok, type Result } from 'neverthrow';

/** Default message used when Standard Schema returns validation issues. */
export const DEFAULT_VALIDATION_MESSAGE = 'Schema validation failed';

/** Message used when sync parsing receives an async validation result. */
export const ASYNC_SCHEMA_MESSAGE = 'Schema validation returned a Promise; use parseAsync';

/** Message used when a schema validator throws before returning an outcome. */
export const EXCEPTION_MESSAGE = 'Schema validation threw';

/** Message used when an async schema validation rejects. */
export const REJECTION_MESSAGE = 'Schema validation rejected';

/** Tagged error returned by all Standard Schema helpers in this package. */
export type SchemaValidationError = {
  readonly tag: 'SchemaValidationError';
  readonly message: string;
  readonly issues: ReadonlyArray<StandardSchemaV1.Issue>;
  readonly cause?: unknown;
};

/**
 * Options shared by all helpers.
 *
 * @remarks
 * `message` customises normal validation failures only. Strict sync-contract
 * failures, thrown validators, and rejected validators keep their fixed
 * diagnostic messages.
 *
 * `validationOptions` is passed through to `schema["~standard"].validate` by
 * helpers that call the validator. It is accepted but unused by
 * {@link fromStandardSchemaResult}.
 */
export type SchemaOptions = {
  readonly message?: string;
  readonly validationOptions?: StandardSchemaV1.Options;
};

/** @internal */
export const schemaValidationError = (
  message: string,
  issues: ReadonlyArray<StandardSchemaV1.Issue>,
  cause?: unknown
): SchemaValidationError => ({
  tag: 'SchemaValidationError',
  message,
  issues,
  cause,
});

/** @internal */
export const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === 'object' && value !== null && 'then' in value && typeof value.then === 'function';

/**
 * Converts an already-resolved Standard Schema outcome into a neverthrow
 * `Result`.
 */
export const fromStandardSchemaResult = <O>(
  outcome: StandardSchemaV1.Result<O>,
  options?: SchemaOptions
): Result<O, SchemaValidationError> => {
  if (outcome.issues !== undefined) {
    return err(schemaValidationError(options?.message ?? DEFAULT_VALIDATION_MESSAGE, outcome.issues));
  }

  return ok(outcome.value);
};
