// --------------------------------------------------------------------------
import { Effect } from 'effect';

export const UNKNOWN_STRING_EFFECT = <E, R>(): Effect.Effect<string, E, R> => Effect.succeed('UNKNOWN');

// --------------------------------------------------------------------------
export type RequestW<T extends Record<string, unknown> = {}> = {
  readonly method: string;
  readonly body?: string;
  readonly headers: Record<string, string>;
  readonly queryStringParameters: Record<string, string>;
  readonly pathParameters: Record<string, string>;
} & T;

// --------------------------------------------------------------------------
export function makeRequestW<T extends Record<string, unknown>>(requestW: RequestW<T>): RequestW<T>;

export function makeRequestW<
  T extends Record<string, unknown> = {},
  U extends Record<string, unknown> | undefined = undefined,
>(requestW: RequestW<T>, u: U): NoInfer<U extends undefined ? RequestW<T> : RequestW<T & U>>;

export function makeRequestW<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  requestW: RequestW<T>,
  u?: U
): RequestW<T> | RequestW<T & U> {
  return u
    ? {
        ...requestW,
        ...u,
      }
    : { ...requestW };
}

// --------------------------------------------------------------------------
export const EMPTY_REQUEST_W: RequestW = {
  method: 'GET',
  headers: {},
  queryStringParameters: {},
  pathParameters: {},
} as const;

// --------------------------------------------------------------------------
export type ResponseW<T extends Record<string, unknown> = {}> = {
  readonly statusCode: number;
  readonly headers: Record<string, string>;
  readonly body?: string;
} & T;

export function makeResponseW<T extends Record<string, unknown>>(responseW: ResponseW<T>): ResponseW<T>;

export function makeResponseW<
  T extends Record<string, unknown> = {},
  U extends Record<string, unknown> | undefined = undefined,
>(responseW: ResponseW<T>, u: U): ResponseW<T & U>;

export function makeResponseW<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  responseW: ResponseW<T>,
  u?: U
): NoInfer<ResponseW<T> | ResponseW<T & U>> {
  return u
    ? {
        ...responseW,
        ...u,
      }
    : { ...responseW };
}

// --------------------------------------------------------------------------
export const EMPTY_RESPONSE_W: ResponseW = {
  statusCode: 200,
  headers: {},
} as const;

// --------------------------------------------------------------------------
// export const foo: RequestW<{}> = makeRequestW(EMPTY_REQUEST_W);
// export const bar: RequestW<{ bum: string }> = makeRequestW(EMPTY_REQUEST_W, { bum: 'pupka' });
// export const bar1: RequestW<{ bum: string }> = makeRequestW<{}, { bum: string }>(EMPTY_REQUEST_W, { bum: 'pupka' });
// export const baz = makeRequestW(bar, { ball: 'sack' });
//
// export const foo_r: ResponseW<{}> = makeResponseW(EMPTY_RESPONSE_W);
// export const bar_r: ResponseW<{ bum: string }> = makeResponseW(EMPTY_RESPONSE_W, { bum: 'pupka' });
// export const bar1_r: ResponseW<{ bum: string }> = makeResponseW<{}, { bum: string }>(EMPTY_RESPONSE_W, {
//   bum: 'pupka',
// });
// export const baz_r: ResponseW<{ bum: string; ball: string }> = makeResponseW(bar_r, { ball: 'sack' });
