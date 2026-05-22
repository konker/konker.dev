import type { BodyRec, Override } from './Rec.js';

// --------------------------------------------------------------------------
type ResponseWBase = {
  readonly statusCode: number;
  readonly headers: Record<string, string>;
};

export type ResponseW<T extends Record<string, unknown> = BodyRec> = ResponseWBase & T;

// --------------------------------------------------------------------------
export function makeResponseW<T extends Record<string, unknown>>(responseW: ResponseW<T>): ResponseW<T>;

export function makeResponseW<
  T extends Record<string, unknown> = {},
  U extends Record<string, unknown> | undefined = undefined,
>(
  responseW: ResponseW<T>,
  u: U
): U extends undefined ? ResponseW<T> : U extends Record<string, unknown> ? ResponseW<Override<T, U>> : never;

export function makeResponseW<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  responseW: ResponseW<T>,
  u?: U
): NoInfer<ResponseW<T> | ResponseW<Override<T, U>>> {
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
