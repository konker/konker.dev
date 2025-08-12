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
