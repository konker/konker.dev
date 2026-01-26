/* eslint-disable fp/no-class */
import { Predicate } from 'effect';
import { TaggedError } from 'effect/Data';
import { isError } from 'effect/Predicate';

export const ERROR_TAG = 'MiddlewareError' as const;

// --------------------------------------------------------------------------
export class MiddlewareError extends TaggedError(ERROR_TAG)<{
  readonly message: string;
  readonly internal?: Array<unknown>;
}> {}

// --------------------------------------------------------------------------
export function isMiddlewareError(x: unknown): x is MiddlewareError {
  return Predicate.isTagged(ERROR_TAG)(x);
}

// --------------------------------------------------------------------------
export function toMiddlewareError(x: unknown, message?: string): MiddlewareError {
  if (isMiddlewareError(x)) {
    return new MiddlewareError({
      message: message ?? x.message,
      internal: [x, ...(x.internal ?? [])],
    });
  }
  if (isError(x)) {
    return new MiddlewareError({
      message: message ?? x.message,
      internal: [x],
    });
  }
  if (typeof x === 'string') {
    return new MiddlewareError({
      message: message ?? x,
      internal: [x],
    });
  }

  return new MiddlewareError({
    message: message ?? 'Internal Server Error',
    internal: [x],
  });
}
