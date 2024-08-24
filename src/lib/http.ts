import * as P from '@konker.dev/effect-ts-prelude';

export const UNKNOWN_STRING_EFFECT = <E, R>(): P.Effect.Effect<string, E, R> => P.Effect.succeed('UNKNOWN');

export const ResponseHeaders = P.Schema.Record(
  P.Schema.String,
  P.Schema.Union(P.Schema.String, P.Schema.Number, P.Schema.Boolean)
);
export type ResponseHeaders = P.Schema.Schema.Type<typeof ResponseHeaders>;

export const OptionalResponseHeaders = P.Schema.Union(ResponseHeaders, P.Schema.Undefined);
export type OptionalResponseHeaders = P.Schema.Schema.Type<typeof OptionalResponseHeaders>;

export const BaseResponse = P.Schema.partial(
  P.Schema.Struct({
    statusCode: P.Schema.Number,
    headers: ResponseHeaders,
    isBase64Encoded: P.Schema.Union(P.Schema.Boolean, P.Schema.Undefined),
    body: P.Schema.Unknown,
  })
);
export type BaseResponse = P.Schema.Schema.Type<typeof BaseResponse>;

export function DEFAULT_500_RESPONSE() {
  return {
    statusCode: 500,
    body: '"InternalServerError"',
  };
}

// eslint-disable-next-line fp/no-nil
export function CHAOS<T>(_: T): T {
  // eslint-disable-next-line fp/no-throw
  throw new Error('BOOM');
}
