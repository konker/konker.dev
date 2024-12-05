import * as P from '@konker.dev/effect-ts-prelude';

export const UNKNOWN_STRING_EFFECT = <E, R>(): P.Effect.Effect<string, E, R> => P.Effect.succeed('UNKNOWN');

export const WithBody = P.Schema.Struct({
  body: P.Schema.Unknown,
});
export type WithBody = P.Schema.Schema.Type<typeof WithBody>;

export const RequestHeaders = P.Schema.Record({
  key: P.Schema.String,
  value: P.Schema.Union(P.Schema.String, P.Schema.Undefined),
});
export type RequestHeaders = P.Schema.Schema.Type<typeof RequestHeaders>;

export const OptionalRequestHeaders = P.Schema.Union(RequestHeaders, P.Schema.Undefined);
export type OptionalRequestHeaders = P.Schema.Schema.Type<typeof OptionalRequestHeaders>;

export const ResponseHeaders = P.Schema.Record({
  key: P.Schema.String,
  value: P.Schema.Union(P.Schema.String, P.Schema.Number, P.Schema.Boolean),
});
export type ResponseHeaders = P.Schema.Schema.Type<typeof ResponseHeaders>;

export const OptionalResponseHeaders = P.Schema.Union(ResponseHeaders, P.Schema.Undefined);
export type OptionalResponseHeaders = P.Schema.Schema.Type<typeof OptionalResponseHeaders>;

// --------------------------------------------------------------------------
export const BaseResponse = P.Schema.partial(
  P.Schema.Struct({
    statusCode: P.Schema.Number,
    headers: ResponseHeaders,
    isBase64Encoded: P.Schema.Union(P.Schema.Boolean, P.Schema.Undefined),
    body: P.Schema.Unknown,
  })
);
export type BaseResponse = P.Schema.Schema.Type<typeof BaseResponse>;

// --------------------------------------------------------------------------
export const BaseSimpleAuthResponse = P.Schema.Struct({
  isAuthorized: P.Schema.Boolean,
});
export type BaseSimpleAuthResponse = P.Schema.Schema.Type<typeof BaseSimpleAuthResponse>;

export function BaseSimpleAuthResponseWithContext<T>(T: P.Schema.Schema<T>) {
  return P.Schema.extend(
    BaseSimpleAuthResponse,
    P.Schema.Struct({
      context: T,
    })
  );
}
export type BaseSimpleAuthResponseWithContext<T> = P.Schema.Schema.Type<
  ReturnType<typeof BaseSimpleAuthResponseWithContext<T>>
>;

// --------------------------------------------------------------------------
export function DEFAULT_500_RESPONSE() {
  return {
    statusCode: 500,
    body: '"InternalServerError"',
  };
}

// --------------------------------------------------------------------------
// eslint-disable-next-line fp/no-nil
export function CHAOS<T>(_: T): T {
  // eslint-disable-next-line fp/no-throw
  throw new Error('BOOM');
}
