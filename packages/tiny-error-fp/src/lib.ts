export const hasTag =
  <T extends string>(tag: T) =>
  (x: unknown): x is { readonly _tag: T } => {
    return typeof x === 'object' && !!x && '_tag' in x && typeof x._tag === 'string' && x._tag === tag;
  };

// --------------------------------------------------------------------------
export function hasErrorMessage(x: unknown): x is { readonly message: string } {
  return typeof x === 'object' && !!x && 'message' in x && typeof x.message === 'string';
}

export function hasErrorName(x: unknown): x is { readonly name: string } {
  return typeof x === 'object' && !!x && 'name' in x && typeof x.name === 'string';
}

export function hasErrorStack(x: unknown): x is { readonly stack: string } {
  return typeof x === 'object' && !!x && 'stack' in x && typeof x.stack === 'string';
}

// --------------------------------------------------------------------------
export function isError<E extends Error = Error>(x: unknown): x is E {
  return x instanceof Error && hasErrorName(x) && hasErrorMessage(x);
}

export function toError(x: unknown): Error {
  return isError(x) ? x : new Error(String(x));
}

// --------------------------------------------------------------------------
export function getStackTraceString(): string {
  // eslint-disable-next-line fp/no-mutation
  Error.stackTraceLimit = 100;
  return Error().stack!;
}
