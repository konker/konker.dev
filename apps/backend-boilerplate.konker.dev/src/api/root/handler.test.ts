import { text } from 'node:stream/consumers';

import { honoRequestFactory } from '@konker.dev/middleware-fp/test/fixtures/honoRequestFactory';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as unit from './handler.js';

describe('root/handler', () => {
  let origProcessEnv: NodeJS.ProcessEnv;
  beforeAll(() => {
    origProcessEnv = process.env;
    process.env = {
      DATABASE_HOST: 'database_host',
      DATABASE_PORT: '1234',
      DATABASE_USERNAME: 'database_username',
      DATABASE_PASSWORD: 'database_password',
      DATABASE_DBNAME: 'database_dbname',
    };
  });
  afterAll(() => {
    process.env = origProcessEnv;
  });

  it('should work as expected with basic request', async () => {
    const TEST_REQUEST = honoRequestFactory('https://example.com/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const actual = await unit.handler(TEST_REQUEST);
    expect(actual.status).toEqual(200);
    expect(await text(actual.body!)).toEqual(
      JSON.stringify({
        apiId: 'backend-boilerplate-konker-dev',
        version: '0.0.2',
        ip: 'UNKNOWN',
        konker: 'RULEZZ!',
        DATABASE_DBNAME: 'database_dbname',
        DATABASE_PORT: 1234,
      })
    );
    expect(Object.fromEntries(actual.headers.entries())).toStrictEqual({
      'content-security-policy':
        "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
      'content-type': 'application/json; charset=utf-8',
      'cross-origin-embedder-policy': 'require-corp',
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-resource-policy': 'same-origin',
      'origin-agent-cluster': '?1',
      'referrer-policy': 'no-referrer',
      'strict-transport-security': 'max-age=15552000; includeSubDomains',
      'x-content-type-options': 'nosniff',
      'x-dns-prefetch-control': 'off',
      'x-download-options': 'noopen',
      'x-frame-options': 'SAMEORIGIN',
      'x-permitted-cross-domain-policies': 'none',
      'x-xss-protection': '0',
    });
  });

  it('should work as expected with x-forwarded-for header', async () => {
    const TEST_REQUEST = honoRequestFactory('https://example.com/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '123.123.123.123',
      },
    });

    const actual = await unit.handler(TEST_REQUEST);
    expect(actual.status).toEqual(200);
    expect(await text(actual.body!)).toEqual(
      JSON.stringify({
        apiId: 'backend-boilerplate-konker-dev',
        version: '0.0.2',
        ip: '123.123.123.123',
        konker: 'RULEZZ!',
        DATABASE_DBNAME: 'database_dbname',
        DATABASE_PORT: 1234,
      })
    );
    expect(Object.fromEntries(actual.headers.entries())).toStrictEqual({
      'content-security-policy':
        "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
      'content-type': 'application/json; charset=utf-8',
      'cross-origin-embedder-policy': 'require-corp',
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-resource-policy': 'same-origin',
      'origin-agent-cluster': '?1',
      'referrer-policy': 'no-referrer',
      'strict-transport-security': 'max-age=15552000; includeSubDomains',
      'x-content-type-options': 'nosniff',
      'x-dns-prefetch-control': 'off',
      'x-download-options': 'noopen',
      'x-frame-options': 'SAMEORIGIN',
      'x-permitted-cross-domain-policies': 'none',
      'x-xss-protection': '0',
    });
  });
});
