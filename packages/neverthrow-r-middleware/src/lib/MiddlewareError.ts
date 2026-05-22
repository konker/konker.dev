export const ERROR_TAG = 'MiddlewareError' as const;

export type MiddlewareError = {
  readonly _tag: typeof ERROR_TAG;
  readonly message: string;
  readonly internal?: ReadonlyArray<unknown>;
};

export function middlewareError(message: string, internal?: ReadonlyArray<unknown>): MiddlewareError {
  return internal === undefined ? { _tag: ERROR_TAG, message } : { _tag: ERROR_TAG, message, internal };
}

export function isMiddlewareError(x: unknown): x is MiddlewareError {
  return typeof x === 'object' && x !== null && (x as { _tag?: unknown })._tag === ERROR_TAG;
}

export function toMiddlewareError(x: unknown, message?: string): MiddlewareError {
  if (isMiddlewareError(x)) {
    return middlewareError(message ?? x.message, [x, ...(x.internal ?? [])]);
  }
  if (x instanceof Error) {
    return middlewareError(message ?? x.message, [x]);
  }
  if (typeof x === 'string') {
    return middlewareError(message ?? x, [x]);
  }
  return middlewareError(message ?? 'Internal Server Error', [x]);
}
