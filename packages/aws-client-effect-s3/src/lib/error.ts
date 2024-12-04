export const TAG = '@konker.dev/aws-client-effect-s3/S3Error';

export type S3Error = {
  readonly _tag: typeof TAG;
  readonly _Params: unknown;
  readonly message: string;
  readonly cause: unknown;
};

export const toS3Error =
  <I>(params: I) =>
  (x: unknown): S3Error => {
    return {
      _tag: TAG,
      _Params: params,
      message:
        typeof x === 'object' && x && 'message' in x && typeof x.message === 'string' && x.message.length > 0
          ? String(x.message)
          : typeof x === 'object' && x && 'code' in x
            ? String(x.code)
            : String(x),
      cause: x,
    };
  };
