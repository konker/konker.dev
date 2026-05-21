/**
 * Asynchronous Standard Schema adapters.
 *
 * @module
 */

import type { ResultAsyncR, ResultR } from '@konker.dev/neverthrow-r/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { errAsync, type Result, ResultAsync } from 'neverthrow';

import {
  EXCEPTION_MESSAGE,
  fromStandardSchemaResult,
  isPromiseLike,
  REJECTION_MESSAGE,
  type SchemaOptions,
  type SchemaValidationError,
  schemaValidationError,
} from './common.js';

type AndParseAsync<I, O> = {
  <E>(r: Result<I, E>): ResultAsync<O, E | SchemaValidationError>;
  <E>(r: ResultAsync<I, E>): ResultAsync<O, E | SchemaValidationError>;
};

/**
 * Builds an async parser for a Standard Schema.
 *
 * @remarks
 * Accepts sync outcomes, promises, and thenables. Thrown validators and
 * rejected validations are converted into `SchemaValidationError` values.
 */
export const parseAsync =
  <I, O>(schema: StandardSchemaV1<I, O>, options?: SchemaOptions) =>
  (input: I): ResultAsync<O, SchemaValidationError> => {
    try {
      const outcome = schema['~standard'].validate(input, options?.validationOptions);

      return ResultAsync.fromPromise(Promise.resolve(outcome), (cause) =>
        schemaValidationError(REJECTION_MESSAGE, [], cause)
      ).andThen((resolvedOutcome) => fromStandardSchemaResult(resolvedOutcome, options));
    } catch (cause) {
      return errAsync(schemaValidationError(EXCEPTION_MESSAGE, [], cause));
    }
  };

/**
 * Parses the success value of a plain neverthrow chain, returning a
 * `ResultAsync`.
 *
 * @remarks
 * Accepts either `Result` or `ResultAsync`, so it can bridge a sync chain into
 * async validation or continue an already-async chain.
 */
export const andParseAsync = <I, O>(schema: StandardSchemaV1<I, O>, options?: SchemaOptions): AndParseAsync<I, O> =>
  (<E>(r: Result<I, E> | ResultAsync<I, E>): ResultAsync<O, E | SchemaValidationError> =>
    isPromiseLike(r)
      ? (r as ResultAsync<I, E>).andThen(parseAsync(schema, options))
      : (r as Result<I, E>).asyncAndThen(parseAsync(schema, options))) as AndParseAsync<I, O>;

/**
 * Parses the success value of a `ResultR`, returning a `ResultAsyncR`.
 */
export const andParseAsyncR =
  <I, O>(schema: StandardSchemaV1<I, O>, options?: SchemaOptions) =>
  <R, E>(rr: ResultR<R, I, E>): ResultAsyncR<R, O, E | SchemaValidationError> =>
  (r) =>
    rr(r).asyncAndThen(parseAsync(schema, options));

/**
 * Parses the success value of a `ResultAsyncR`, preserving the async reader
 * chain.
 */
export const andThenParseAsyncR =
  <I, O>(schema: StandardSchemaV1<I, O>, options?: SchemaOptions) =>
  <R, E>(rr: ResultAsyncR<R, I, E>): ResultAsyncR<R, O, E | SchemaValidationError> =>
  (r) =>
    rr(r).andThen(parseAsync(schema, options));
