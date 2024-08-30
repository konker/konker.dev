export const TAG = 'SqsError';

export type SqsError = {
  readonly _tag: typeof TAG;
  readonly _Params: unknown;
  readonly message: string;
  readonly cause: unknown;
};

export const toSqsError =
  <I>(params: I) =>
  (x: unknown): SqsError => {
    return {
      _tag: TAG,
      _Params: params,
      message: typeof x === 'object' && x && 'message' in x ? (x as any).message : String(x),
      cause: x,
    };
  };
