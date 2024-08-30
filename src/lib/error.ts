export const TAG = 'SnsError';

export type SnsError = {
  readonly _tag: typeof TAG;
  readonly _Params: unknown;
  readonly message: string;
  readonly cause: unknown;
};

export const toSnsError =
  <I>(params: I) =>
  (x: unknown): SnsError => {
    return {
      _tag: TAG,
      _Params: params,
      message: typeof x === 'object' && x && 'message' in x ? (x as any).message : String(x),
      cause: x,
    };
  };
