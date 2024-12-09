import { Schema } from 'effect';
import * as Effect from 'effect/Effect';

export const UNKNOWN_STRING_EFFECT = <E, R>(): Effect.Effect<string, E, R> => Effect.succeed('UNKNOWN');

export const WithBody = Schema.Struct({
  body: Schema.Unknown,
});
export type WithBody = Schema.Schema.Type<typeof WithBody>;

export const RequestHeaders = Schema.Record({
  key: Schema.String,
  value: Schema.Union(Schema.String, Schema.Undefined),
});
export type RequestHeaders = Schema.Schema.Type<typeof RequestHeaders>;

export const OptionalRequestHeaders = Schema.Union(RequestHeaders, Schema.Undefined);
export type OptionalRequestHeaders = Schema.Schema.Type<typeof OptionalRequestHeaders>;

export const ResponseHeaders = Schema.Record({
  key: Schema.String,
  value: Schema.Union(Schema.String, Schema.Number, Schema.Boolean),
});
export type ResponseHeaders = Schema.Schema.Type<typeof ResponseHeaders>;

export const OptionalResponseHeaders = Schema.Union(ResponseHeaders, Schema.Undefined);
export type OptionalResponseHeaders = Schema.Schema.Type<typeof OptionalResponseHeaders>;

// --------------------------------------------------------------------------
export const BaseResponse = Schema.partial(
  Schema.Struct({
    statusCode: Schema.Number,
    headers: ResponseHeaders,
    isBase64Encoded: Schema.Union(Schema.Boolean, Schema.Undefined),
    body: Schema.Unknown,
  })
);
export type BaseResponse = Schema.Schema.Type<typeof BaseResponse>;

// --------------------------------------------------------------------------
export const BaseSimpleAuthResponse = Schema.Struct({
  isAuthorized: Schema.Boolean,
});
export type BaseSimpleAuthResponse = Schema.Schema.Type<typeof BaseSimpleAuthResponse>;

export function BaseSimpleAuthResponseWithContext<T>(T: Schema.Schema<T>) {
  return Schema.extend(
    BaseSimpleAuthResponse,
    Schema.Struct({
      context: T,
    })
  );
}
export type BaseSimpleAuthResponseWithContext<T> = Schema.Schema.Type<
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
