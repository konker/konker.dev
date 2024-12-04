export const TAG = 'SecretsManagerError';

export type SecretsManagerError = {
  readonly _tag: typeof TAG;
  readonly _Params: unknown;
  readonly message: string;
  readonly cause: unknown;
};

export const toSecretsManagerError =
  <I>(params: I) =>
  (x: unknown): SecretsManagerError => {
    return {
      _tag: TAG,
      _Params: params,
      message: typeof x === 'object' && x && 'message' in x ? (x as any).message : String(x),
      cause: x,
    };
  };
