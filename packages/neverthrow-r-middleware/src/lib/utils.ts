import { Result, ResultAsync } from 'neverthrow';

import type { MiddlewareError } from './MiddlewareError.js';
import { toMiddlewareError } from './MiddlewareError.js';

export function sanitizeRecord(record?: Record<string, string | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(record ?? {}).map(([k, v]) => [k, v ?? '']));
}

export function fromPromise<T>(
  thunk: () => Promise<T>,
  onError: (e: unknown) => MiddlewareError = toMiddlewareError
): ResultAsync<T, MiddlewareError> {
  return ResultAsync.fromPromise(thunk(), onError);
}

export const tryJsonParse: (input: string) => Result<unknown, MiddlewareError> = Result.fromThrowable(
  (input: string) => JSON.parse(input) as unknown,
  (e) => toMiddlewareError(e, 'Invalid JSON')
);

export const tryJsonStringify: (input: unknown) => Result<string, MiddlewareError> = Result.fromThrowable(
  (input: unknown) => JSON.stringify(input),
  (e) => toMiddlewareError(e, 'JSON stringify failed')
);
