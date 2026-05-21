import type { Override, StrBodyRec } from './Rec.js';

// --------------------------------------------------------------------------
type RequestWBase = {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
  readonly queryStringParameters: Record<string, string>;
  readonly pathParameters: Record<string, string>;
};

export type RequestW<T extends Record<string, unknown> = StrBodyRec> = RequestWBase & T;

// --------------------------------------------------------------------------
export function makeRequestW<T extends Record<string, unknown>>(requestW: RequestW<T>): RequestW<T>;

export function makeRequestW<
  T extends Record<string, unknown> = {},
  U extends Record<string, unknown> | undefined = undefined,
>(
  requestW: RequestW<T>,
  u: U
): NoInfer<U extends undefined ? RequestW<T> : U extends Record<string, unknown> ? RequestW<Override<T, U>> : never>;

export function makeRequestW<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  requestW: RequestW<T>,
  u?: U
): RequestW<T> | RequestW<Override<T, U>> {
  return u
    ? {
        ...requestW,
        ...u,
      }
    : { ...requestW };
}

// --------------------------------------------------------------------------
export const EMPTY_REQUEST_W: RequestW = {
  url: '/',
  method: 'GET',
  headers: {},
  queryStringParameters: {},
  pathParameters: {},
} as const;
