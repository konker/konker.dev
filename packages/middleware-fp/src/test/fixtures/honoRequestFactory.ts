/* eslint-disable fp/no-nil,fp/no-get-set,@typescript-eslint/no-empty-function */
import { Buffer } from 'node:buffer';

import { type HonoRequest } from 'hono';
import type { RouterRoute } from 'hono/types';

export function honoRequestFactory(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
): HonoRequest {
  const raw = new Request(url, {
    method: options.method ?? 'GET',
    headers: options.headers ?? {},
    body: options.body ?? null,
  });

  return {
    raw,
    method: raw.method,
    bodyCache: {},
    path: '',
    routeIndex: 0,
    valid<T>(_target: T): any {
      return '';
    },
    addValidatedData(): void {},
    arrayBuffer(): Promise<ArrayBuffer> {
      return Promise.resolve(Buffer.from(options.body ?? '').buffer);
    },
    blob(): Promise<Blob> {
      return Promise.resolve(new Blob([Buffer.from(options.body ?? '').buffer]));
    },
    formData(): Promise<FormData> {
      return Promise.resolve(new FormData());
    },
    header(): any {
      return options.headers ?? {};
    },
    json<T = any>(): Promise<T> {
      return Promise.resolve(JSON.parse(options.body ?? ''));
    },
    param(): any {
      return {
        id: '123',
      };
    },
    parseBody(): Promise<string> {
      return Promise.resolve(options.body ?? '');
    },
    queries(): any {
      return Object.fromEntries(new URL(url).searchParams.entries());
    },
    query(): any {
      return Object.fromEntries(new URL(url).searchParams.entries());
    },
    text(): Promise<string> {
      return Promise.resolve(options.body ?? '');
    },
    get url(): string {
      return url;
    },
    get matchedRoutes(): Array<RouterRoute> {
      return [];
    },
    get routePath(): string {
      return url;
    },
  };
}
