// --------------------------------------------------------------------------
import type { BodyRec } from './RequestResponseHandler.js';

export type ResponseW<T extends Record<string, unknown> = BodyRec> = {
  readonly statusCode: number;
  readonly headers: Record<string, string>;
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
