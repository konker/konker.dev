export const TAG = 'TinyFileSystemError';

export type TinyFileSystemError = {
  readonly _tag: typeof TAG;
  readonly message: string;
  readonly cause: unknown;
};

export function toTinyFileSystemError(x: unknown): TinyFileSystemError {
  return {
    _tag: TAG,
    message: typeof x === 'object' && x && 'message' in x ? (x as any).message : String(x),
    cause: x,
  };
}
