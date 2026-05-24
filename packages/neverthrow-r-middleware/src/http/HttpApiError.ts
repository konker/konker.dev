/* eslint-disable */
import { Result } from 'neverthrow';

import type { ResponseW } from './ResponseW.js';
import { makeResponseW } from './ResponseW.js';

export const ERROR_TAG = 'HttpApiError' as const;

export class HttpApiError extends Error {
  readonly _tag = ERROR_TAG;
  readonly statusCode: number;
  readonly internal: Array<unknown> | undefined;

  constructor({
    internal,
    message,
    statusCode,
  }: {
    readonly statusCode: number;
    readonly message: string;
    readonly internal?: Array<unknown>;
  }) {
    super(message);
    this.name = ERROR_TAG;
    this.statusCode = statusCode;
    this.internal = internal;
  }
}

export function isHttpApiError(x: unknown): x is HttpApiError {
  return (
    x instanceof HttpApiError || (typeof x === 'object' && x !== null && (x as { _tag?: unknown })._tag === ERROR_TAG)
  );
}

export function toHttpApiError(x: unknown, statusCode?: number, message?: string): HttpApiError {
  if (isHttpApiError(x)) {
    return new HttpApiError({
      statusCode: statusCode ?? x.statusCode,
      message: message ?? x.message,
      internal: [x, ...(x.internal ?? [])],
    });
  }

  if (x instanceof Error) {
    return new HttpApiError({
      statusCode: statusCode ?? 500,
      message: message ?? x.message,
      internal: [x],
    });
  }

  if (typeof x === 'string') {
    return new HttpApiError({
      statusCode: statusCode ?? 500,
      message: message ?? x,
      internal: [x],
    });
  }

  return new HttpApiError({
    statusCode: statusCode ?? 500,
    message: message ?? 'Internal Server Error',
    internal: [x],
  });
}

export function toErrorResponseW(error: HttpApiError): ResponseW {
  const bodyResult = Result.fromThrowable(
    () =>
      JSON.stringify({
        message: error.message,
        statusCode: error.statusCode,
      }),
    () => new Error('JSON stringify failed')
  )();

  return makeResponseW({
    statusCode: error.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: bodyResult.match(
      (body) => body,
      () => '{"message":"Internal Server Error","statusCode":500}'
    ),
  });
}
