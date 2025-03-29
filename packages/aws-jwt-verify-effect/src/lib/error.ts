export const TAG = 'JwtVerifyError';

export type JwtVerifyError = {
  readonly _tag: typeof TAG;
  readonly message: string;
  readonly cause: unknown;
};

export const toJwtVerifyError = (x: unknown): JwtVerifyError => {
  return {
    _tag: TAG,
    message: typeof x === 'object' && x && 'message' in x ? (x as any).message : String(x),
    cause: x,
  };
};
