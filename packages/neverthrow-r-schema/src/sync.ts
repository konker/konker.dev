/**
 * Synchronous Standard Schema adapters.
 *
 * @module
 */

import type { ResultR } from '@konker.dev/neverthrow-r/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { err, type Result } from 'neverthrow';

import {
  ASYNC_SCHEMA_MESSAGE,
  EXCEPTION_MESSAGE,
  fromStandardSchemaResult,
  isPromiseLike,
  type SchemaOptions,
  type SchemaValidationError,
  schemaValidationError,
} from './common.js';

/**
 * Builds a sync parser for a Standard Schema.
 *
 * @remarks
 * Use this only with schemas whose `validate` method returns synchronously. If
 * validation returns a promise or thenable, the result is an `Err` with
 * {@link ASYNC_SCHEMA_MESSAGE}.
 */
export const parse =
  <I, O>(schema: StandardSchemaV1<I, O>, options?: SchemaOptions) =>
  (input: I): Result<O, SchemaValidationError> => {
    try {
      const outcome = schema['~standard'].validate(input, options?.validationOptions);

      if (isPromiseLike(outcome)) {
        return err(schemaValidationError(ASYNC_SCHEMA_MESSAGE, []));
      }

      return fromStandardSchemaResult(outcome, options);
    } catch (cause) {
      return err(schemaValidationError(EXCEPTION_MESSAGE, [], cause));
    }
  };

/** Parses the success value of a plain neverthrow `Result`. */
export const andParse =
  <I, O>(schema: StandardSchemaV1<I, O>, options?: SchemaOptions) =>
  <E>(r: Result<I, E>): Result<O, E | SchemaValidationError> =>
    r.andThen(parse(schema, options));

/** Parses the success value of a `ResultR`. */
export const andParseR =
  <I, O>(schema: StandardSchemaV1<I, O>, options?: SchemaOptions) =>
  <R, E>(rr: ResultR<R, I, E>): ResultR<R, O, E | SchemaValidationError> =>
  (r) =>
    rr(r).andThen(parse(schema, options));
